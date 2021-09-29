const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json'); // basic config file read
const { Client, User } = require('unb-api'); // define our basic client for the UNB-API
const client = new Client(config.econtoken); // define the rest of the client for economy and verify with our econ token
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
module.exports = {
    name: 'heist',
    description: 'Heist System',
    async execute(message, args, bot){
        console.log(args);
        switch (args[0]){ // first arg
            case 'list':
                ListHeistLocations(message, args, bot);
                break;
            case 'setup':
                if(IsUserOnCooldown(message.author.id)){
                    message.channel.send(`<@${message.author.id}>, you are on cooldown, you cant start a heist.`);
                    return;
                }
                if(IsUserAlreadyInAHeist(message.author.id)){
                    message.channel.send(`<@${message.author.id}>, you already have a heist going, canceling request.`);
                    return;
                }
                message.channel.send(`<@${message.author.id}>, respond to select a location to get started.`);
                GetLocationFromName(message.author, message, bot);
                break;
            case 'join':
                if(IsUserOnCooldown(message.author.id)){
                    message.channel.send(`<@${message.author.id}>, you are on cooldown, you cant start a heist.`);
                    return;
                }
                if(IsUserAlreadyInAHeist(message.author.id)){
                    message.channel.send(`<@${message.author.id}>, you are already in a heist you cannot join another`);
                    return;
                }
                JoinHeist(message.author, message);
                break;
            case 'split':
                ChooseSplit(message.author, message);
                break;
            case 'status':
                if(!fs.existsSync(`./heists/heist${message.author.id}.json`)){
                    StatusforUserInHeist(message.author, message, bot);
                    return;
                } 
                HeistStatus(message.author, message, bot);
                break;
            case 'start':
                if(fs.existsSync(`./heists/heist${message.author.id}.json`)){
                    heistFile = fs.readFileSync(`./heists/heist${message.author.id}.json`);
                    heist = JSON.parse(heistFile);
                } else {
                    message.channel.send(`<@${message.author.id}>, you are not in a heist, or are not the owner`);
                    return;
                }
                if(IsUserAlreadyInArray(heist.users, message.author.id)){
                    StartHeist(message.author, message, bot);
                }
                break;
            case 'equipment':
                if(args[1] == "list"){ // second arg
                    if(args[2] == "inventory" || args[2] == 'inv'){
                        ListUsersInventory(message, message.author, bot);
                        return;
                    } 
                    ListEquipment(message, bot);
                    break;
                } else if (args[1] == "buy"){
                    if(IsUserAlreadyInAHeist(message.author.id)){
                        message.channel.send(`<@${message.author.id}>, you are in a heist, how tf would by equipment?`);
                        return;
                    }
                    BuyEquipment(message, bot, args);
                    break;
                } else {
                    message.channel.send(`<@${message.author.id}>, Valid Equipment Args: list/buy`);
                    break;
                }
                break;
            case 'cancel':
                if(fs.existsSync(`./heists/heist${message.author.id}.json`)){
                    CancelHeist(message.author, message);
                    return;
                } else {
                    message.channel.send(`<@${message.author.id}>, you are not in a heist to cancel or are not a host`);
                }
                break;
            default: 
                message.channel.send(`<@${message.author.id}>, please provide a valid argument of setup/start/join/status/split/list/equipment.`);
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

function CoolDownData(){
    cooldownRaw = fs.readFileSync(`./heists/usersoncooldown.json`);
    return JSON.parse(cooldownRaw);
}

function UserHesitInfo(file){
    userheistinforaw = fs.readFileSync(file);
    userheistinfo = JSON.parse(userheistinforaw);
    return userheistinfo;
}

function IsUserOnCooldown(userID){
    cooldownData = CoolDownData();
    if(cooldownData.users.length <= 0){
        return false;
    }
    for(i=0;i<cooldownData.users.length;i++){
        curUser = cooldownData.users[i];
        if(curUser.id == userID){
            if(Date.now() > curUser.cooldown){
                cooldownData.users.splice(i, 1);
                pglibrary.WriteToJson(cooldownData, `./heists/usersoncooldown.json`);
                return false;
            } else if(Date.now() < curUser.cooldown && i == cooldownData.users.length){
                return true;
            }
        } else {
            if(i == cooldownData.users.length){
                return false;
            }
        }
    }
    return true;
}

function StatusforUserInHeist(user, message, bot){
    console.log(`Reading DIR`);
    var host;
    fs.readdir('./heists/', (err, files) => {
        files.forEach(file =>{
            if(file.startsWith('heist') && file.endsWith('.json')){
                console.log(file);
                filedata = UserHesitInfo(`./heists/${file}`);
                if(filedata.users){
                    userids = [];
                    for(i=0;i<filedata.users.length;i++){
                        curUser = filedata.users[i];
                        userids.push(curUser.id);
                        if(curUser.host){
                            host = curUser;
                        }
                    }
                    if(userids.includes(user.id) && host.host){
                        hostNew = host;
                        hostNew.username = host.name;
                        HeistStatus(hostNew, message, bot);
                    } else {
                        message.channel.send(`<@${message.author.id}>, you do not have a heist going, canceling request.`);
                        return;
                    }
                }
            }
        });
    });
}

// Main Heist Related Functions

async function GetLocationFromName(user, message, bot){
    collector = message.channel.createMessageCollector(message.channel, {time: 5000});
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
            console.log(curLocation);
            if(curLocation.name.toLowerCase() == m.content.toLowerCase()){
                m.channel.send(`<@${m.author.id}>, You have selected ${curLocation.name}.`);
                SetupHeist(message.author, message, curLocation, bot);
                collector.stop();
                return;
            }
        }
        collector.stop();
    });
    collector.on('end', (collected, reason) => {
        if(collected.size == 0){
            message.channel.send(`<@${message.author.id}>, you did not reply in time, cancelling.`);
            return;
        }
    });
}

function IsUserAlreadyInAHeist(userID){
    if(fs.existsSync(`./heists/heist${userID}.json`)){
        return true;
    } else {
        fs.readdir('./heists/', (err, files) => {
            files.forEach(file =>{
                if(file.startsWith('heist') && file.endsWith('.json')){
                    console.log(file);
                    filedata = UserHesitInfo(`./heists/${file}`);
                    userids = [];
                    if(!filedata.users) return;
                    for(i=0;i<filedata.users.length;i++){
                        curUser = filedata.users[i];
                        if(curUser.id == userID){
                            return true;
                        }
                    }
                }
            });
        });
    }
}

async function StartHeist(user, message, bot){
    file = `./heists/heist${user.id}.json`;
    userHeist = UserHesitInfo(file);
    if(userHeist.started){
        message.channel.send(`<@${user.id}>, The heist has already started started, run ${config.prefix}heist status instead.`);
        return;
    }
    server = bot.guilds.cache.get("631008739830267915");
    console.log(server);
    userHeist.started = true;
    date = new Date();
    console.log(`Current Date: ${date}`);
    console.log(`Heist Ending Time: ${userHeist.location[0].timetocomplete}`);
    timetoEndOn = pglibrary.addHours(date, userHeist.location[0].timetocomplete);
    console.log(`Time to End on : ${timetoEndOn}`);
    userHeist.shouldend = timetoEndOn;
    pglibrary.WriteToJson(userHeist, file);
    hChannel = server.channels.cache.find(c => c.name == `${user.username.toLowerCase()}s-heist`);
    if(typeof hChannel === 'undefined'){
        console.log(`Could not find channel, stopping heist`);
        userHeist.started = false;
        pglibrary.WriteToJson(userHeist, file);
        return;
    } else {
        console.log(`Found Channel`);
    }
    hChannel.send(`<@${user.id}>, you have started the Heist, Time until Heist is done: ${new Date(timetoEndOn).getUTCHours()} Hour(s).`);
}

function ToggleLocation(heist){
    locationData = HeistLocationData();
    for(i=0;i<locationData.locations.length;i++){
        curLocation = locationData.locations[i];
        if(curLocation.name == heist.location[0].name){
            if(curLocation.available == 1){
                locationData.locations[i].madeunavailable = new Date();
                locationData.locations[i].available = 0;
            }
        }
    }
    pglibrary.WriteToJson(locationData, `./heists/locations.json`);
}

async function SetupHeist(user, message, location, bot){
    if(location.available == 0){
        message.channel.send(`<@${message.author.id}>, that location is unavailable for a heist, please wait.`);
        return;
    }
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
    date = new Date();
    timetoEndOn = pglibrary.addHours(date, location.timetocomplete);
    console.log(timetoEndOn);
    fileinfo = {"users":users, "location": [location], "started": false, "shouldend": timetoEndOn};
    pglibrary.WriteToJson(fileinfo, newfile);
    server = bot.guilds.cache.get("631008739830267915");
    server.channels.create(`${user.username}'s Heist`).then(channel =>{
        let catergory = server.channels.cache.find(c => c.name == "Heists")
        if(!catergory) throw new Error("Category cannot be found");
        channel.setParent(catergory.id);
        channel.send(`<@${user.id}>, You have successfuly setup your heist, you can wait for users to join or you can start it.`);
    }).catch(console.error);
    ToggleLocation(fileinfo);
}

function JoinHeist(user, message){
    if(!message.mentions.users.first()){
        message.channel.send(`<@${user.id}>, please provide a valid user mention.`);
        return;
    }
    target = message.mentions.users.first().id;
    file = `./heists/heist${target}.json`;
    requestedHeist = UserHesitInfo(file);
    if(IsUserAlreadyInArray(requestedHeist.users, user.id)){
        message.channel.send(`<@${user.id}>, you are already apart of this heist.`);
        return;
    }
    if(requestedHeist.users.length >= 4){
        message.channel.send(`<@${user.id}>, You cannot join this heist as the max Amount of users in heist has been met.`);
        return;
    }  
    console.log(target);
    if(requestedHeist.started){
        message.channel.send(`<@${user.id}>, This heist has already started, cancelling request.`);
        return;
    }
    invData = HeistInvData();
    for(i=0;i<invData.users.length;i++){
        curUser = invData.users[i];
        if(curUser.id == user.id){
            totalmatching = 0
            curUser.inv.forEach(item => {
                if(requestedHeist.location[0].reqs.includes(item)){
                    totalmatching++;
                }
            });
            if(totalmatching != requestedHeist.location[0].reqs.length){
                message.channel.send(`<@${user.id}>, You do not have the equipment requirements to join this heist.`);
                return;
            }
        }
    }
    console.log(requestedHeist);
    usersInHeist = requestedHeist.users.length + 1;
    userinfo = {"name": user.username, "id": user.id, "host": false, "split": 100 / usersInHeist }
    console.log(userinfo);
    requestedHeist.users.push(userinfo);
    pglibrary.WriteToJson(requestedHeist, file);
    UpdateUserSplits(target);
    message.channel.send(`<@${user.id}>, you have successfuly joined ${requestedHeist.users.find(user => user.host == true).name}'s heist.`);
}

function CancelHeist(user, message){
    file = `./heists/heist${user.id}.json`;
    userHeist = UserHesitInfo(file);
    if(userHeist.started){
        message.channel.send(`<@${user.id}>, The heist has already started started, run ${config.prefix}heist status instead.`);
        return;
    }
    server = message.guild;
    console.log(server);
    hChannel = server.channels.cache.find(c => c.name == `${user.username.toLowerCase()}s-heist`);
    if(typeof hChannel === 'undefined'){
        console.log(`Could not find channel, stopping heist`);
        return;
    } else {
        console.log(`Found Channel`);
    }
    hChannel.delete();
    filetodelete = `./heists/heist${user.id}.json`;
    fs.unlinkSync(filetodelete, function(err){
        if(err){
            console.log(`There was an error when trying to delete file, make sure it exists.`);
            return;
        }
    });
}

function UpdateUserSplits(userID){
    file = `./heists/heist${userID}.json`;
    requestedHeist = UserHesitInfo(file);
    newusers = [];
    console.log(newusers);
    for(i=0;i<requestedHeist.users.length;i++){
        curUser = requestedHeist.users[i];
        console.log(`Updating Split for user ${curUser.name}`);
        console.log(curUser);
        requestedHeist.users[i].split =  Math.round(100 / usersInHeist);
        newusers.push(requestedHeist.users[i]);
        console.log(newusers);
    }
    requestedHeist.users = newusers;
    pglibrary.WriteToJson(requestedHeist, file);
}

function ChooseSplit(user, message){
    collector = message.channel.createMessageCollector(message.channel, {time: 5000});
    file = `./heists/heist${user.id}.json`;
    if(!fs.existsSync(file)){
        message.channel.send(`<@${user.id}>, you do not have a heist going, cancelling.`);
        return;
    }
    userheistinfo = UserHesitInfo(file);
    for(i=0;i<userheistinfo.users.length;i++){
        curUser = userheistinfo.users[i];
        if(curUser.id == user.id){
            if(!curUser.host){
                message.channel.send(`<@${user.id}>, you are not the host of heist and cannot set the split.`);
            } else {
                message.channel.send(`<@${message.author.id}>, choose a split for each user in your heist. Format: 70/25/5. User 1 Gets 70%, User 2 gets 25%, and User 3 gets 5%. Total Split must be less than 100%.`);
            }
        }
    }
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
        splitN = split.split("/");
        console.log(splitN);
        totalsplitpercent = 0
        for(i=0;i<splitN.length;i++){
            console.log(splitN[i]);
            currentSplit = splitN[i]
            console.log(currentSplit);
            currentSplit = parseInt(currentSplit);
            console.log(currentSplit);
            if(typeof currentSplit !== `number`) {
                m.channel.send(`<@${user.id}>, a givin split was not a number, please provid a valid number.`);
                return;
            }
            if(i>userheistinfo.users.length){
                splitN.splice(i, 1);
            }
            if(currentSplit >= 100){
                m.channel.send(`<@${user.id}>, any split cannot be greater than or equal to 100.`);
                return;
            }
            totalsplitpercent += currentSplit;
        }
        if(totalsplitpercent != 100){
            m.channel.send(`<@${user.id}>, the total split has to be a total 100%, your split is less or greater than 100%.`);
        } 
        newusers = [];
        console.log(newusers);
        for(i=0;i<userheistinfo.users.length;i++){
            curUser = userheistinfo.users[i];
            console.log(curUser);
            curSplit = splitN[i];
            console.log(`Current Split in String: ${curSplit}`);
            curSplit = parseInt(curSplit);
            console.log(`Current Split in Int: ${curSplit}`);
            userheistinfo.users[i].split = curSplit;
            newusers.push(userheistinfo.users[i]);
            console.log(newusers);
        }
        userheistinfo.users = newusers;
        pglibrary.WriteToJson(userheistinfo, file);
        collector.stop();
        displaySplit = ""
        splitN.forEach(split =>{
            displaySplit += `${split}/`
        })
        console.log(displaySplit.length);
        if(displaySplit.endsWith('/')){
            displaySplit = displaySplit.substring(0, displaySplit.length - 1);
        }
        message.channel.send(`<@${user.id}>, you have set the split to ${displaySplit}`);
    });
}

function HeistStatus(user, message, bot){
    file = `./heists/heist${user.id}.json`;
    userheistinfo = UserHesitInfo(file);
    if(userheistinfo.started) {
        status = "Started"
    } else {
        status = "Has Not been Started"
    }
    date = new Date();
    console.log(date);
    let embed = new MessageEmbed()
    .setTitle(`Heist Information for ${user.username}`)
    .setAuthor(bot.user.username, bot.user.displayAvatarURL)
    .setColor(`#87a9ff`)
    .setDescription(`Current Heist Information.`)
    .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot")
    .addField(`Heist Location`, userheistinfo.location[0].name)
    .addField(`Heist Start Status`, `${status}`);
    if(userheistinfo.started){
        embed.addField(`Time Left:`, `${new Date(userheistinfo.shouldend).getUTCHours()} hour(s) left`);
    } else {
        console.log(`time for heist to complete: ${userheistinfo.location[0].timetocomplete}`);
        timetoEndOn = pglibrary.addHours(date, userheistinfo.location[0].timetocomplete)
        console.log(timetoEndOn);
        embed.addField(`Time Left:`, `${new Date(timetoEndOn).getUTCHours()} hour(s) left`);
    }
    
    userheistinfo.users.forEach(user => {
        console.log(user);
        embed.addField(user.name, `Slot: ${userheistinfo.users.indexOf(user) + 1} \n Is Host: ${user.host} \n Reward Cut: ${user.split}%`);
    });
    message.channel.send({content: `<@${message.author.id}>`, embeds: [embed]});
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
            if(location.available == 1){
                locationavail = "Available for Heist"
            } else {
                locationavail = "Not Available for Heist"
            }
            embed.addField(location.name, `Availability: ${locationavail}, Run the List Command with the name of the location for more info`);
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
            if(curlocation.name.toLowerCase() == args[1].toLowerCase()) {
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
                .addField(`Time to Complete`, `Takes ${curlocation.timetocomplete} hour(s) to finish`);
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
            if((curItem.name.includes('Tier 1') || curItem.name.includes('Small')) && curField.name.includes('Tier 1')){
                if(curField.value.startsWith('1')){
                    curField.value = ``;
                }
                curField.value += `${curItem.name}, Cost: $${pglibrary.commafy(curItem.cost)} \n`
            } else if ((curItem.name.includes('Tier 2') || curItem.name.includes('Medium')) && curField.name.includes('Tier 2')){
                if(curField.value.startsWith('1')){
                    curField.value = ``;
                }
                curField.value += `${curItem.name}, Cost: $${pglibrary.commafy(curItem.cost)} \n`
            } else if ((curItem.name.includes('Tier 3') || curItem.name.includes('Large')) && curField.name.includes('Tier 3')){
                if(curField.value.startsWith('1')){
                    curField.value = ``;
                }
                curField.value += `${curItem.name}, Cost: $${pglibrary.commafy(curItem.cost)} \n`
            }
        }
    }
    message.channel.send({content: `<@${message.author.id}>`, embeds: [embed]});
}

function ListUsersInventory(message, user, bot){
    inv = HeistInvData();
    for(i=0;i<inv.users.length;i++){
        curUser = inv.users[i];
        if(curUser.id == user.id){
            console.log(curUser);
            console.log(curUser.inv);
            let embed = new MessageEmbed()
            .setTitle(`${user.username}'s Invetory'`)
            .setAuthor(bot.user.username, bot.user.displayAvatarURL)
            .setColor(`#87a9ff`)
            .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot")
            .addField(`Your Inventory`, `1`);
            curUser.inv.forEach(item => {
                if(embed.fields[0].value.startsWith('1')){
                    embed.fields[0].value = ``;
                }
                embed.fields[0].value += `${item} \n`;
            });
            message.channel.send({content: `<@${user.id}>`, embeds: [embed]});
        }
    }
}

function BuyEquipment(message, bot, args){
    console.log(`User ${message.author.username} is buying equipment`);
    heistequipment = HeistItemData();
    message.channel.send(`<@${message.author.id}>, Select an item to buy by replying to this message with the item name, to buy multiple do Item Name 1, Item Name 2, Item Name 3 and so on.`);
    collector = message.channel.createMessageCollector(message.channel, {time: 5000});

    collector.on('collect', m => {
        if (m.author.bot) return;
        if (m.author.id != message.author.id) return;
        if (m.channel.id != message.channel.id) return;
        if(typeof m === 'undefined') return;
        console.log(m.content);
        items = m.content.split(',');
        for(i=0;i<items.length;i++){
            items[i] = items[i].trim();
        }
        console.log(items, `Length: ${items.length}`);
        requestedItems = FindEquipment(items);
        console.log(requestedItems);
        if(typeof requestedItems === 'undefined'){
            m.channel.send(`<@${m.author.id}>, Could not find the Requested item(s)`);
            collector.stop();
            return;
        }
        console.log(requestedItems);
        requestedItems = RemoveDuplicateItems(m.author.id, requestedItems);
        console.log(requestedItems);
        if(requestedItems.length == 0){
            message.channel.send(`<@${m.author.id}>, You already own all those items. To check your inventory use ${config.prefix}heist equipment inv`);
            collector.stop();
            return;
        }
        console.log(requestedItems);
        client.getUserBalance(m.guild.id, m.author.id).then(async (econuser) =>{
            console.log(`Checking if user has enough cash`);
            cost = 0;
            requestedItems.forEach(item => {
                cost += item.cost;
            });
            if(econuser.cash >= cost){
                client.editUserBalance(m.guild.id, m.author.id, {cash: -cost, bank:0});
                await HeistInventoryMain(m.author, requestedItems);
                string = ""
                for(i=0;i<requestedItems.length;i++){
                    item = requestedItems[i];
                    console.log(`Item: ${item.name}`);
                    if(i == requestedItems.length - 2){ // i starts at 0, so the 2nd to last index would be -2
                        console.log(`Item is 2nd to Last, adjusting string`);
                        if(item.name.includes('Drill') || item.name.includes('Medkit')){
                            string += `${item.name} and a `;
                        } else {
                            string += `${item.name} and `;
                        }
                        console.log(string);
                    } else {
                        console.log(`String is not 2nd to last`);
                        string += `${item.name}, `;
                        console.log(string);
                    }
                }
                if(string.endsWith(', ')){
                    string = string.substring(0, string.length - 2); 
                }
                sPrefix = stringPrefix(string);
                message.channel.send(`<@${m.author.id}>, You have bought ${sPrefix} ${string} for ${pglibrary.commafy(cost)} points.`);
                collector.stop();
                return;
            } else {
                message.channel.send(`<@${m.author.id}>, You do not have enough cash in hand for that action.`);
                collector.stop();
                return;
            }
        });
        collector.stop();
    });

    collector.on('end', (collected, reason) => {
        if(collected.size == 0){
            message.channel.send(`<@${message.author.id}>, you did not reply in time, cancelling.`);
            return;
        }
    });
}

function stringPrefix(string){
    stringprefix = "";
    if(string.startsWith('Tier 1 Drill') || string.startsWith('Tier 1 Medkit')){
        stringprefix = "a";
    } else if (!string.startsWith('Medium Dufflebags')){
        stringprefix = "some";
    }
    return stringprefix;
}

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

function FindEquipment(items){
    heistequipment = HeistItemData();
    itemsReturn = [];
    console.log(itemsReturn);
    for (i=0;i<heistequipment.items.length;i++){
        curItem = heistequipment.items[i];
        console.log(curItem);
        for(l=0;l<items.length;l++){
            curRItem = items[l];
            console.log(curRItem);
            if(curItem.name.toLowerCase() == curRItem.toLowerCase()){
                console.log(`Current Item ${curItem.name} is equal to ${curRItem}`);
                itemsReturn.push(curItem);
            }
        }
    }
    console.log(itemsReturn);
    return itemsReturn;
}

async function HeistInventoryMain(user, itemArray){
    heistinventory = HeistInvData();
    if(IsUserAlreadyInArray(heistinventory.users, user.id)){
        console.log(heistinventory.users);
        for (i=0;i<heistinventory.users.length;i++){
            curUser = heistinventory.users[i];
            if(curUser.id == user.id){
                console.log(curUser);
                itemArray.forEach(item =>{
                    heistinventory.users[i].inv.push(item.name);
                })
                console.log(heistinventory.users);
            }
        }
    } else {
        invA = [];
        itemArray.forEach(item =>{
            invA.push(item.name);
        })
        newuser = {"name":user.username,"id":user.id, "inv":invA};
        heistinventory.users.push(newuser);
        console.log(newuser);
    }
    pglibrary.WriteToJson(heistinventory, './heists/usersinventory.json')
}

function RemoveDuplicateItems(userID, itemArray){
    console.log(`Removing Duplicates from ${itemArray}`);
    console.log(`Checking for Dupes for User ${userID}`);
    heistinventory = HeistInvData();
    newItems = [];
    if(heistinventory.users.length == 0) {
        return false;
    }
    if(!IsUserAlreadyInArray(heistinventory.users, userID)){
        return itemArray;
    }
    for(i=0;i<heistinventory.users.length;i++){
        curUser = heistinventory.users[i];
        console.log(`Current User to check for dupes: ${curUser.name}`);
        console.log(curUser);
        if(curUser.id == userID){
            if(curUser.inv.length == 0) {
                console.log(`Users Inventory is empty`);
                return itemArray;
            } else {
                console.log(`Users inventory is not empty`);
                for(l=0;l<itemArray.length;l++){
                    item = itemArray[l];
                    console.log(`Current Item to check for ${item.name}`);
                    if(curUser.inv.includes(item.name)){
                        console.log(`Users inventory already contains ${item.name}`);
                    } else {
                        newItems.push(item);
                        console.log(newItems);
                    }
                }
            }
        }
    }
    return newItems;
}
