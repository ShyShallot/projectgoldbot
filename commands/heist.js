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
            case 'start':
                // todo
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

// Main Heist Related Functions

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