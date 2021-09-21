const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json'); // basic config file read
const { Client } = require('unb-api'); // define our basic client for the UNB-API
const client = new Client(config.econtoken); // define the rest of the client for economy and verify with our econ token
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
module.exports = {
    name: 'heist',
    description: 'Heist System',
    execute(message, args, bot){
        console.log(args);
        switch (args[0]){ // first arg
            case 'list':
                ListHeistLocations(message, args, bot);
                break;
            case 'setup':
                if(fs.existsSync(`./heists/heist${user.id}.json`)){
                    message.channel.send(`<@${user.id}>, you already have a heist going, canceling request.`);
                    return;
                }
                message.channel.send(`<@${message.author.id}>, respond to select a location to get started.`);
                rLocation = GetLocationFromName(message.author, message);
                if(typeof rLocation === `undefined`){ 
                    message.channel.send(`<@${message.author.id}>, could not find the location, or no input was provided.`) 
                    return;
                }
                SetupHeist(user, message, rLocation);
                break;
            case 'join':
                //todo
                break;
            case 'split':
                message.channel.send(`<@${message.author.id}>, choose a split for each user in your heist. Format: 70/25/5. User 1 Gets 70%, User 2 gets 25%, and User 3 gets 5%. Total Split must be less than 100%.`);
                ChooseSplit(message.author,message);
                break;
            case 'status':
                //todo
                break;
            case 'equipment':
                if(args[1] == "list"){ // second arg
                    ListEquipment(message, bot);
                    break;
                } else if (args[1] == "buy"){
                    BuyEquipment(message, bot, args);
                    break;
                }
                break;
            default: 
                message.channel.send(`<@${message.author.id}>, please provide a valid argument of start/status/list.`);
                break;
        }
    }
}

// Basic Data Loading

function HeistLocationData(){
    heistlocationdata = fs.readFileSync('./heists/locations.json');
    heistlocations = JSON.parse(heistlocationdata);
    return heistlocations;
}

function HeistItemData(){
    heistequipsdata = fs.readFileSync('./heists/items.json');
    heistequipment = JSON.parse(heistequipsdata);
    return heistequipment;
}

function HeistInvData(){
    heistinvdata = fs.readFileSync('./heists/usersinventory.json');
    heistinv = JSON.parse(heistinvdata);
    return heistinv;
}

function UserHesitInfo(file){
    userheistinforaw = fs.readFileSync(file);
    userheistinfo = JSON.parse(userheistinforaw);
    return userheistinfo;
}

// Main Heist Related Functions

function GetLocationFromName(user, message){
    collector = message.channel.createMessageCollector(message.channel, {time: 10000});
    heistlocations = HeistLocationData();
    collector.on('collect', m => {
        
        if (m.author.bot) return;
        if (m.author.id != user.id) return;
        if (m.channel.id != message.channel.id) return;
        if(typeof m === 'undefined') return;
        console.log(m.content);
        rLocation = m.content;
        for (i=0;i<heistlocations.locations.length;i++){
            curLocation = heistlocations.locations[i];
            if(curlocation.name == m.content){
                m.channel.send(`<@${m.author.id}>, You have selected ${curLocation.name}.`)
                return curLocation;
            }
        }
        collector.stop();
    });
}

async function SetupHeist(user, message, location){
    invData = HeistInvData();
    for(i=0;i<invData.users.length;i++){
        curUser = invData.users[i];
        if(curUser.id == user.id){
            totalmatching = 0
            curUser.inv.forEach(item => {
                if(location.reqs.includes(item)){
                    totalmatching++;
                }
            });
            if(totalmatching != location.reqs.length){
                message.channel.send(`<@${user.id}>, You do not have the equipment requirements for this location.`);
                return;
            }
        }
    }
    newfile = `./heists/heist${user.id}.json`;
    userinfo = {"name": user.username, "id": user.id, "host": true, "split":100}
    users = [];
    users.push(userinfo);
    fileinfo = {"users":users, "location": [location], "started": false};
    await pglibrary.WriteToJson(fileinfo, newfile);
    message.channel.send(`<@${user.id}>, You have successfuly setup your heist, you can wait for users to join or you can start it.`);
}

function ChooseSplit(user, message){
    file = `./heists/heist${user.id}.json`;
    if(!fs.existsSync(file)){
        message.channel.send(`<@${user.id}>, you do not have a heist going, cancelling.`);
        return;
    }
    userheistinfo = UserHesitInfo(file);
    if(userheistinfo.users.length <= 1){
        message.channel.send(`<@${user.id}>, you lack the required amount of users to set a split`);
    }
    collector.on('collect', m => {
        if (m.author.bot) return;
        if (m.author.id != user.id) return;
        if (m.channel.id != message.channel.id) return;
        if(typeof m === 'undefined') return;
        console.log(m.content);
        split = m.content;
        split.split('/');
        totalsplitpercent = 0
        for(i=0;i<split.length;i++){
            split[i] = parseInt(split[i]);
            if(typeof split[i] !== `number`) {
                m.channel.send(`<@${user.id}>, a givin split was not a number, please provid a valid number.`);
                return;
            }
            if(i>userheistinfo.users.length){
                split.splice(i, 1);
            }
            if(split[i] >= 100){
                m.channel.send(`<@${user.id}>, any split cannot be greater than or equal to 100.`);
                return;
            }
            totalsplitpercent += split[i];
        }
        if(totalsplitpercent > 100){
            m.channel.send(`<@${user.id}>, the total split totals to over 100%, please provide a valid split.`);
        }
        for(i=0;i<userheistinfo.users.length;i++){
            curUser = userheistinfo.users[i];
            curUser.split = split[i];
            userheistinfo.users.splice(i, 1);
            userheistinfo.users.push(curUser);
        }
        fileinfo = {"users":userheistinfo.users, "location": userheistinfo.location, "started": userheistinfo.started};
        pglibrary.WriteToJson(fileinfo, file);
        collector.stop();
    });
}

function DifficultyDisplay(diff){
    display = ""
    switch(diff){
        case 1:
            display = "A Baby could do this"
            break;
        case 2:
            display = "You might stub your toe"
            break;
        case 3:
            display = "A bullet will hit near your balls."
            break;
        case 4:
            display = "You might as well lose all that weight."
            break;
        case 5:
            display = "Your grave will be 20ft Under the ground."
            break;
        default: 
            display = "Something fucking broke please mention <@313159590285934595>"
            break;
    }
    return display;
}

function ListHeistLocations(message, args, bot){
    heistlocations = HeistLocationData();
    if (!args[1]){
        let embed = new MessageEmbed()
        .setTitle(`Heist Location Information`)
        .setAuthor(bot.user.username, bot.user.displayAvatarURL)
        .setColor(`#87a9ff`)
        .setDescription(`Current Heist Location Information.`)
        .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot")
        heistlocations.locations.forEach(location => {
            console.log(location);
            embed.addField(location.name, `Run the List Command with the name of the location for more info`);
        });
        message.channel.send({content: `<@${message.author.id}>`, embeds: [embed]});
    } else {
        for(i=2;i<args.length;i++){ // hacky solution for combining our args
            if(typeof args[i] === 'undefined') return;
            args[1] += " " + args[i];
        }
        console.log(args[1]);
        for (i = 0, l = heistlocations.locations.length; i < l; i++){
            curlocation = heistlocations.locations[i];
            if(curlocation.name == args[1]) {
                if(curlocation.available == 1){
                    locationavail = "Available for Heist"
                } else {
                    locationavail = "Not Available for Heist"
                }
                diffDisplay = DifficultyDisplay(curlocation.difficulty);
                let embed = new MessageEmbed()
                .setTitle(`Heist Location Information`)
                .setAuthor(bot.user.username, bot.user.displayAvatarURL)
                .setColor(`#87a9ff`)
                .setDescription(`Current Heist Location Information.`)
                .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot")
                .addField(`Name`, `${curlocation.name}`)
                .addField(`Description`, `${curlocation.description}`)
                .addField(`Location Difficulty`, `${diffDisplay}`)
                .addField(`Max Possible Reward Outcome`, `$${pglibrary.commafy(curlocation.maxreward)}`)
                .addField('Required Equipment', `${curlocation.reqs}`)
                .addField(`Optional Equipment`, `${curlocation.optionalreqs}`)
                .addField(`Location Availability`, `${locationavail}`)
                message.channel.send({content: `<@${message.author.id}>`, embeds: [embed]});
            }
        }
    }
}

// Equipment Related Functions

function ListEquipment(message, bot){
    heistequipment = HeistItemData();
    let embed = new MessageEmbed()
    .setTitle(`Heist Equipment Information`)
    .setAuthor(bot.user.username, bot.user.displayAvatarURL)
    .setColor(`#87a9ff`)
    .setDescription(`Current Heist Equipment Information.`)
    .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot")
    .addFields(
        {name: 'Tier 1 Equipment', value: `1`},
        {name: 'Tier 2 Equipment', value: `1`},
        {name: `Tier 3 Equipment`, value: `1`}
    )
    console.log(embed);
    console.log(embed.fields);
    for (i=0; i<heistequipment.items.length; i++){
        curItem = heistequipment.items[i];
        console.log(curItem);
        for (l=0; l<embed.fields.length;l++){
            curField = embed.fields[l];
            console.log(curField);
            if(curItem.name.includes('Tier 1') && curField.name.includes('Tier 1')){
                if(curField.value.startsWith('1')){
                    curField.value = ``;
                }
                curField.value += `${curItem.name}, Cost: $${pglibrary.commafy(curItem.cost)} \n`
            } else if (curItem.name.includes('Tier 2') && curField.name.includes('Tier 2')){
                if(curField.value.startsWith('1')){
                    curField.value = ``;
                }
                curField.value += `${curItem.name}, Cost: $${pglibrary.commafy(curItem.cost)} \n`
            } else if (curItem.name.includes('Tier 3') && curField.name.includes('Tier 3')){
                if(curField.value.startsWith('1')){
                    curField.value = ``;
                }
                curField.value += `${curItem.name}, Cost: $${pglibrary.commafy(curItem.cost)} \n`
            }
        }
    }
    message.channel.send({content: `<@${message.author.id}>`, embeds: [embed]});
}

function BuyEquipment(message, bot, args){
    heistequipment = HeistItemData();
    message.channel.send(`<@${message.author.id}>, Select an item to buy by replying to this message with the item name.`);
    collector = message.channel.createMessageCollector(message.channel, {time: 10000});

    collector.on('collect', m => {
        
        if (m.author.bot) return;
        if (m.author.id != message.author.id) return;
        if (m.channel.id != message.channel.id) return;
        if(typeof m === 'undefined') return;
        console.log(m.content);
        rItem = m.content;
        requestedItem = FindEquipment(rItem);
        if(typeof requestedItem === 'undefined'){
            m.channel.send(`<@${m.author.id}>, Could not find the Requested item`);
            return;
        }
        console.log(requestedItem);
        client.getUserBalance(m.guild.id, m.author.id).then(async (econuser) =>{
            console.log(`Checking if user has enough cash`);
            if(econuser.cash >= requestedItem.cost){
                if(DoesUserAlreadyHaveREquip(m.author.id, requestedItem.name)){
                    m.channel.send(`<@${m.author.id}>, You already have (a) ${requestedItem.name}, canceling request.`);
                    return;
                }
                await HeistInventoryMain(m.author, requestedItem.name);
                message.channel.send(`<@${m.author.id}>, You have bought (a) ${requestedItem.name}.`);
            } else {
                message.channel.send(`<@${m.author.id}>, You do not have enough cash in hand for that action.`);
            }
        });
        collector.stop();
    });
}
//newuser = {"name": message.author.username, "id": message.author.id}
function IsUserAlreadyInArray(array, userID){ // check if the user already exists in the given array.
    console.log(`Checking if ${userID} is in the array`);
    console.log(array);
    if (!(array.length == 0)) { // if the length of the Users object array in our original array is not empty
        console.log(array.length);
        for (var i = 0, l = array.length; i < l; i++) { // initially i is set to 0, then l is set to the amount of entry's in data.users, and if I is less than L add 1 to I.
            curUser = array[i].id; // get the ID for the current user 
            console.log(curUser);
            if (userID == curUser) { // if the userID we want to check is equal to the curUser in the arrray return true
                console.log(`User ${userID} is already in the array`);
                return true;
            } 
        }
        return false;
    } else {
        return false; // return false if the amount of entry's in the Users object array is empty
    }
}   

function FindEquipment(item){
    heistequipment = HeistItemData();
    for (i=0;i<heistequipment.items.length;i++){
        curItem = heistequipment.items[i];
        if(curItem.name == item){
            console.log(curItem);
            return curItem;
        }
    }
}

async function HeistInventoryMain(user, item){
    heistinventory = HeistInvData();
    if(IsUserAlreadyInArray(heistinventory.users, user.id)){
        console.log(heistinventory.users);
        for (i=0;i<heistinventory.users.length;i++){
            curUser = heistinventory.users[i];
            if(curUser.id == user.id){
                console.log(curUser);
                curUser.inv.push(item)
                newuser = {"name":user.username,"id":user.id,"inv":curUser.inv};
                heistinventory.users.splice(i, 1);
                await pglibrary.sleep(100);
                heistinventory.users.push(newuser);
                console.log(heistinventory.users);
            }
        }
    } else {
        invA = [];
        invA.push(item);
        newuser = {"name":user.username,"id":user.id, "inv":invA};
        heistinventory.users.push(newuser);
        console.log(newuser);
    }
    finaljson = {"users":heistinventory.users};
    console.log(finaljson);
    pglibrary.WriteToJson(finaljson, './heists/usersinventory.json')
}

function DoesUserAlreadyHaveREquip(userID, itemName){
    heistinventory = HeistInvData();
    if(heistinventory.users.length == 0) {
        return false;
    }
    for(i=0;i<heistinventory.users.length;i++){
        curUser = heistinventory.users[i];
        if(curUser.id == userID){
            if(curUser.inv.length == 0) {
                return false;
            } else {
                if(curUser.inv.includes(itemName)){
                    return true;
                } else {
                    return false;
                }
            }
        }
    }
}