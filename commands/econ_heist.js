const {MessageEmbed, MessageActionRow, MessageButton, ButtonInteraction} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json'); // basic config file read
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
const points_manager = require('../points/manager');
const masterdb = require('../master-db/masterdb');
const bot = require('../mainbotfile');
const heisthandler = require('../heists/heisthandler');
module.exports = {
    name: 'heist',
    description: 'Setup and Start or Join Heists to earn large amounts of money',
    args: 'Possible First Args: list/l | setup | join/j | split | status | start | cancel | equipment | give | inv/inventory',
    active: false,
    econ: true,
    async execute(message, args, bot,guildId){
        console.log(args);
        userStat = await IsUserOnCooldown(message.author.id,guildId);
        InHeist = await IsUserAlreadyInAHeist(message.author.id,guildId);
        switch (args[0]){ // check the first argument of the command 
            case 'l':
            case 'list':
                ListHeistLocations(message, args, bot, guildId);
                break;
            case 'setup':
                if(userStat){
                    message.channel.send(`<@${message.author.id}>, you are on cooldown, you cant start a heist.`);
                    return;
                }
                if(InHeist){
                    message.channel.send(`<@${message.author.id}>, you already have a heist going, canceling request.`);
                    return;
                }
                HeistLocationSelect(message,args,bot,guildId);
                break;
            case 'j':
            case 'join':
                if(userStat){
                    message.channel.send(`<@${message.author.id}>, you are on cooldown, you cant start a heist.`);
                    return;
                }
                if(InHeist){
                    message.channel.send(`<@${message.author.id}>, you are already in a heist you cannot join another`);
                    return;
                }
                JoinHeist(message.author.id, message, bot);
                break;
            case 'status':
                HeistStatus(message, bot);
                break;
            case 'start':
                if(!InHeist){
                    message.channel.send(`<@${message.author.id}>, You are not in a heist.`);
                    return;
                }
                StartHeist(message.author.id,guildId,message,bot);
                break;
            case 'equip':
            case 'equipment':
                if(args[1] == "list"){ // second arg
                    await ListEquipment(message, bot);
                    break;
                } else if (args[1] == "buy"){
                    if(InHeist){
                        message.channel.send(`<@${message.author.id}>, you are in a heist, how tf would by equipment?`);
                        return;
                    }
                    BuyEquipment(message, args,bot,guildId);
                    break;
                } else {
                    message.channel.send(`<@${message.author.id}>, Valid Equipment Args: list/buy`);
                    break;
                }
            case 'inventory':
            case 'inv':
                ListUsersInventory(message.author.id, message, guildId);
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

// --- DATA FUNCTIONS --- \\

async function HeistLocationData(guildId){
    locations = await masterdb.getGuildJson(guildId,'locations');
    return locations;
}

function HeistItemData(){
    return JSON.parse(fs.readFileSync('./heists/items.json'));
}

async function HeistInvData(guildId){
    fileStat = await masterdb.doesFileExist(guildId,'usersinventory');
    if(fileStat){
        data = await masterdb.getGuildJson(guildId,'usersinventory');
        return data;
    } else {
        emptArr = [];
        await masterdb.writeGuildJsonFile(guildId,'usersinventory',emptArr);
        return emptArr;
    }
}

async function CoolDownData(guildId){
    cooldown = await masterdb.getGuildJson(guildId,'heistcooldowns');
    return cooldown;
}

function UserHesitInfo(file){
    userheistinforaw = fs.readFileSync(file);
    userheistinfo = JSON.parse(userheistinforaw);
    return userheistinfo;
}

async function IsUserOnCooldown(userID,guildId){
    cooldownData = await CoolDownData(guildId);
    if(cooldownData.length <= 0){
        return false;
    }
    if(cooldownData.some(u => u.id == userID)){
        return true;
    } else {
        return false;
    }
}

// ---- HEIST EQUIPMENT FUNCTIONS ---- \\

async function ListEquipment(message, bot){
    equipment = HeistItemData();
    guildPntDB = await points_manager.fetchData(message.guild.id);
    const embed = new MessageEmbed()
    .setTitle(`Heists Equipment Store`)
    .setAuthor(bot.user.username,bot.user.displayAvatarURL())
    .setColor(`#87a9ff`)
    .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot")
    .addFields(
        {name: 'Tier 1 Equipment', value: `1`, inline:true},
        {name: 'Tier 2 Equipment', value: `1`, inline:true},
        {name: `Tier 3 Equipment`, value: `1`, inline:true}
    )
    equipment.forEach(item => {
        if(item.name.includes(`Tier 1`) || item.name.includes(`Small`)){
            if(embed.fields[0].value.startsWith(`1`)){
                embed.fields[0].value = ``;
            }
            embed.fields[0].value += `${item.name}, \n Cost: ${guildPntDB.point_symbol}${pglibrary.commafy(item.cost)} \n \n`;
        }
        if(item.name.includes(`Tier 2`) || item.name.includes(`Medium`)){
            if(embed.fields[1].value.startsWith(`1`)){
                embed.fields[1].value = ``;
            }
            embed.fields[1].value += `${item.name}, \n Cost: ${guildPntDB.point_symbol}${pglibrary.commafy(item.cost)} \n \n`;
        }
        if(item.name.includes(`Tier 3`) || item.name.includes(`Large`)){
            if(embed.fields[2].value.startsWith(`1`)){
                embed.fields[2].value = ``;
            }
            embed.fields[2].value += `${item.name}, \n Cost: ${guildPntDB.point_symbol}${pglibrary.commafy(item.cost)} \n \n`;
        }
    });
    message.channel.send({content: `<@${message.author.id}>`, embeds: [embed]});
}

async function BuyEquipment(message,args,bot,guildId){
    if(!args[2]){
        message.channel.send(`<@${message.author.id}>, Please Provide a valid Tier Argument`);
        return;
    }
    equipment = HeistItemData();
    UserData = await points_manager.fetchUser(message.author.id,true,guildId);
    guildDb = await masterdb.getGuildJson(guildId,'config');
    guildPntDB = await points_manager.fetchData(guildId);
    tieredList = {tier1items:[],tier2items:[],tier3items:[]}
    for(i=0;i<equipment.length;i++){
        if(equipment[i].name.includes("Tier 1") || equipment[i].name.includes("Small")){
            tieredList.tier1items.push(equipment[i]);
        }
        if(equipment[i].name.includes("Tier 2") || equipment[i].name.includes("Medium")){
            tieredList.tier2items.push(equipment[i]);
        }
        if(equipment[i].name.includes("Tier 3") || equipment[i].name.includes("Large")){
            tieredList.tier3items.push(equipment[i]);
        }
    }
    const embed = new MessageEmbed()
    .setColor(`#87a9ff`)
    .setTitle(`Heist Equipment Store`)
    .setAuthor(bot.user.username,bot.user.displayAvatarURL())
    .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot")
    .setDescription("Type Done When You are Done.")
    switch(args[2].toLowerCase()){
        case 'light':
            start = 0;
            finalList = tieredList.tier1items;
            embed.addField(`Tier 1 Equipment`,`1`,true);
            break;
        case 'medium':
            start = 1;
            finalList = tieredList.tier2items;
            embed.addField(`Tier 2 Equipment`,`1`,true);
            break;
        case 'heavy':
            start = 2;
            finalList = tieredList.tier3items;
            embed.addField(`Tier 3 Equipment`,`1`,true);
            break;
    }
    buttons = await createEquipmentButtons(start,tieredList);
    finalList.forEach(item => {
        for(i=0;i<embed.fields.length;i++){
            switch(embed.fields[i].name){
                case 'Tier 1 Equipment':
                    if(item.name.includes(`Tier 1`) || item.name.includes(`Small`)){
                        if(embed.fields[i].value.startsWith(`1`)){
                            embed.fields[i].value = ``;
                        }
                        embed.fields[i].value += `${item.name}, \n Cost: ${guildPntDB.point_symbol}${pglibrary.commafy(item.cost)} \n \n`;
                    }
                    break;
                case 'Tier 2 Equipment':
                    if(item.name.includes(`Tier 2`) || item.name.includes(`Medium`)){
                        if(embed.fields[i].value.startsWith(`1`)){
                            embed.fields[i].value = ``;
                        }
                        embed.fields[i].value += `${item.name}, \n Cost: ${guildPntDB.point_symbol}${pglibrary.commafy(item.cost)} \n \n`;
                    }
                    break;
                case 'Tier 3 Equipment':
                    if(item.name.includes(`Tier 3`) || item.name.includes(`Large`)){
                        if(embed.fields[i].value.startsWith(`1`)){
                            embed.fields[i].value = ``;
                        }
                        embed.fields[i].value += `${item.name}, \n Cost: ${guildPntDB.point_symbol}${pglibrary.commafy(item.cost)} \n \n`;
                    }
                    break;
            }
        }
    });
    equipInter = await message.channel.send({content:`<@${message.author.id}>`,embeds:[embed], components:[buttons]});
    const interactCollect = equipInter.createMessageComponentCollector({
        filter: ({user}) => user.id = message.author.id
    });
    const messageCollect = equipInter.channel.createMessageCollector({});
    messageCollect.on('collect', m => {
        if(m.content.toLowerCase() == "done" && m.author.id === message.author.id){
            equipInter.delete();
            m.delete();
            message.delete();
        }
    });
    interactCollect.on('collect', async interaction => {
        console.log(`INTERACTION FROM: ${interaction.user.id}`)
        for(i=0;i<finalList.length;i++){
            console.log(finalList[i], i);
            if(finalList[i].name == interaction.customId){
                curItm = finalList[i];
                if(curItm.cost <= UserData.balance.cash){
                    fileStat = await masterdb.doesFileExist(guildId,`heistinventories`);
                    console.log(fileStat);
                    if(!fileStat){
                        fileStruct = [{user:message.author.id,inv:[curItm.name]}];
                        await masterdb.writeGuildJsonFile(guildId,`heistinventories`,fileStruct);
                        interaction.reply(`<@${message.author.id}>, You have successfully purchased a ${curItm.name}`);
                        return;
                    }
                    guildInv = await masterdb.getGuildJson(guildId,'heistinventories');
                    found = false;
                    index = 0;
                    for(y=0;y<guildInv.length;y++){
                        if(guildInv[y].user == message.author.id){
                            found = true;
                            index = y;
                        }
                    }
                    if(!found){
                        guildInv.push({user:message.author.id,inv:[curItm.name]});
                    } else {
                        if(guildInv[index].inv.includes(curItm.name)){
                            interaction.reply(`<@${message.author.id}>, You already own ${curItm.name}`);
                            return;
                        }
                        guildInv[index].inv.push(curItm.name);
                    }
                    await masterdb.writeGuildJsonFile(guildId,'heistinventories',guildInv);
                    interaction.reply(`<@${message.author.id}>, You have successfully purchased a ${curItm.name} for ${guildPntDB.point_symbol}${pglibrary.commafy(curItm.cost)}`);
                    points_manager.giveUserPoints(message.author.id,-curItm.cost,'cash',true,guildId);
                    return;
                } else {
                    interaction.message.delete();
                    message.channel.send(`<@${message.author.id}>, You do Not have Enough Cash In Hand to buy this item`);
                    return;
                }
            }
        }
    });
}

async function createEquipmentButtons(start,list){
    if(!start){
        start = 0;
    }
    const buttons = new MessageActionRow();
    switch(start){
        case 0: 
            finalList = list.tier1items;
            break;
        case 1:
            finalList = list.tier2items;
            break;
        case 2:
            finalList = list.tier3items;
            break;
    }
    for(i=0;i<finalList.length;i++){
        buttons.addComponents(
            new MessageButton()
            .setCustomId(`${finalList[i].name}`)
            .setLabel(`${finalList[i].name}`)
            .setStyle('PRIMARY')
        )
    }
    return buttons;
}

async function ListUsersInventory(user,message,guildid){
    guildConfig = await masterdb.getGuildJson(guildid,'config');
    fileStat = await masterdb.doesFileExist(guildid,'heistinventories');
    if(!fileStat){
        message.channel.send(`<@${message.author.id}>, Your Inventory is Currently Empty, to buy an item use: ${guildid.prefix}heist equipment buy [Light, Medium , Heavy]`);
        return;
    }
    guildInv = await masterdb.getGuildJson(guildid,'heistinventories');
    if(!guildInv.some(usr => usr.user === user)){
        message.channel.send(`<@${message.author.id}>, Your Inventory is Currently Empty, to buy an item use: ${guildid.prefix}heist equipment buy [Light, Medium , Heavy]`);
        return;
    }
    for(i=0;i<guildInv.length;i++){
        if(guildInv[i].user === user){
            const embed = new MessageEmbed()
            .setTitle(`${message.author.username}`)
            .setAuthor(message.author.username,message.author.displayAvatarURL())
            .setColor(`#87a9ff`)
            .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot")
            .addFields(
                {name: 'Tier 1 Equipment', value: `1`, inline:true},
                {name: 'Tier 2 Equipment', value: `1`, inline:true},
                {name: `Tier 3 Equipment`, value: `1`, inline:true}
            )
            guildInv[i].inv.forEach(item => {
                if(item.includes(`Tier 1`) || item.includes(`Small`)){
                    if(embed.fields[0].value.startsWith(`1`)){
                        embed.fields[0].value = ``;
                    }
                    embed.fields[0].value += `${item} \n`;
                }
                if(item.includes(`Tier 2`) || item.includes(`Medium`)){
                    if(embed.fields[1].value.startsWith(`1`)){
                        embed.fields[1].value = ``;
                    }
                    embed.fields[1].value += `${item} \n`;
                }
                if(item.includes(`Tier 3`) || item.includes(`Large`)){
                    if(embed.fields[2].value.startsWith(`1`)){
                        embed.fields[2].value = ``;
                    }
                    embed.fields[2].value += `${item} \n`;
                }
            });
            for(i=0;i<embed.fields.length;i++){
                if(embed.fields[i].value == `1`){
                    embed.fields.splice(i,1);
                    i--;
                }
            }
            message.channel.send({content:`<@${message.author.id}>`,embeds:[embed]});
        }
    }
}

// --- HEIST MAIN FUNCTIONS --- \\

async function HeistLocationSelect(message,args,bot,guildId){
    locations = await HeistLocationData(guildId);
    const buttons = new MessageActionRow();
    for(i=0;i<locations.length;i++){
        buttons.addComponents(
            new MessageButton()
            .setCustomId(`${locations[i].name}`)
            .setLabel(`${locations[i].name}`)
            .setStyle('PRIMARY')
            .setDisabled(!locations[i].available)
        );
    }
    const embed = new MessageEmbed()
    .setColor(`#87a9ff`)
    .setTitle(`Select Heist Location`)
    .setAuthor(bot.user.username,bot.user.displayAvatarURL())
    .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot");
    const interact = await message.channel.send({content:`<@${message.author.id}>`,embeds:[embed], components:[buttons]});
    const interactCollect = interact.createMessageComponentCollector({
        filter: ({user}) => user.id = message.author.id
    });
    interactCollect.on('collect', async interact => {
        if(!interact.isButton()){return;}
        guildInv = await masterdb.getGuildJson(interact.guildId,`heistinventories`).catch(async (err)=>{
            console.error(err);
            await interact.message.delete();
            await interact.message.channel.send(`<@${message.author.id}>, You Do Not Have Items for this Heist`);
            return;
        });
        if(typeof guildInv !== 'object'){return;}
        for(i=0;i<locations.length;i++){
            if(locations[i].name == interact.customId){
                location = locations[i];
            }
        }
        for(i=0;i<guildInv.length;i++){
            if(guildInv[i].user !== message.author.id){continue};
            match = 0;
            for(y=0;y<guildInv[i].inv.length;y++){
                if(location.reqs.includes(guildInv[i].inv[y])){
                    match++;
                }
            }
        }
        const buttons = new MessageActionRow();
        for(i=0;i<locations.length;i++){
            buttons.addComponents(
                new MessageButton()
                .setCustomId(`${locations[i].name}`)
                .setLabel(`${locations[i].name}`)
                .setStyle('PRIMARY')
                .setDisabled(true)
            );
        }
        const embed = new MessageEmbed()
            .setColor(`#87a9ff`)
            .setTitle(`You Have Selected: ${interact.customId}`)
            .setAuthor(bot.user.username,bot.user.displayAvatarURL())
            .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot");
        if(match !== location.reqs.length){await interact.message.delete(); await interact.message.channel.send(`<@${message.author.id}>, You Do Not Have Items for this Heist`);return;}
        await interact.update({content: `<@${message.author.id}>`,embeds:[embed], components:[buttons]});
        HeistSetup(message.author.id,interact.customId,interact.guild.id,interact);
    })
    // Any Further Function is Then Handled to the bot.on
}

async function HeistSetup(userId,locationName,guildId,Interaction){
    locations = await HeistLocationData(guildId);
    for(i=0;i<locations.length;i++){
        if(locations[i] == locationName){
            location = locations[i];
        }
    }
    category = Interaction.guild.channels.cache.find(channel => channel.type == 'GUILD_CATEGORY' && channel.name == "Heists");
    if(typeof category === 'undefined'){
        category = await Interaction.guild.channels.create('Heists',{type:"GUILD_CATEGORY"});
    }
    heistchannel = await Interaction.guild.channels.create(`$${Interaction.user.username}s-heist`,{type: 'text'});
    heistchannel.setParent(category.id);
    heistchannel.send(`<@${userId}>, You have successfuly setup your heist, you can wait for users to join or you can start it.`);
    userStruct = {userid:userId,host:true,name:Interaction.user.username};
    heistFileStruct = {server:guildId,channel:heistchannel.id,location:location,users:[userStruct],started:false,dateStarted:undefined};
    heistFileName = `heist-${userId}-${guildId}`;
    await saveHeistFile(heistFileName,heistFileStruct).then((status)=>{console.log(status)});

}

async function saveHeistFile(fileName,data){
    await pglibrary.WriteToJson(data,`./heists/${fileName}.json`).then((status) => {
        console.log(status);
    }).catch((err)=>{
        console.error(err);
        return;
    });
    return Promise.resolve(`Saved File: ${fileName}`);
}

async function ListHeistLocations(message,args,bot,guildId){
    locations = await HeistLocationData(guildId);
    equipment = HeistItemData();
    guildConfig = await masterdb.getGuildJson(guildId,'config');
    if(!args[1]){
        const embed = new MessageEmbed()
        .setTitle(`Heist Locations for ${message.guild.name}`)
        .setAuthor(bot.user.username, bot.user.displayAvatarURL())
        .setColor(`#87a9ff`)
        .setDescription(`Type ${guildConfig.prefix}heist list [Location Name] for Exact Details`)
        .addField(`Additional Information`, "Starting A Heist With Optional Equipment Increases your Chance of Success")
        .setFooter(`Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot`);
        locations.forEach(location => {
            if(location.available){
                avail = `Available For Heist`;
            } else {avail = `Unavailable for Heist`}
            embed.addField(location.name, `Availability: ${avail}`);
        });
        message.channel.send({content: `<@${message.author.id}>`, embeds: [embed]});
    } else {
        for(i=2;i<args.length;i++){
            args[1] += ` ${args[i]}`;
        }
        for(i=0;i<locations.length;i++){
            curLoc = locations[i];
            if(curLoc.name.toLowerCase() == args[1].toLowerCase()){
                reqEqpCost = 0;
                optEqpCost = 0;
                if(curLoc.available){
                    avail = `Available For Heist`;
                } else {avail = `Unavailable for Heist`}
                for(y=0;y<equipment.length;y++){
                    curItm = equipment[y];
                    if(curLoc.reqs.includes(curItm.name)){
                        reqEqpCost += curItm.cost;
                    }
                    if(curLoc.optionalreqs.includes(curItm.name)){
                        optEqpCost += curItm.cost;
                    }
                }
                // Embed
                reqs = "";
                curLoc.reqs.forEach(item => {
                    reqs += `${item}, `;
                });
                optReqs = "";
                curLoc.optionalreqs.forEach(item => {
                    optReqs += `${item}, `;
                });
                diff = DifficultyDisplay(curLoc.difficulty);
                const embed = new MessageEmbed()
                .setTitle(`${curLoc.name} Heist Information`)
                .setAuthor(bot.user.username, bot.user.displayAvatarURL())
                .setColor(`#87a9ff`)
                .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot")
                .addField(`Description`, `${curLoc.description}`)
                .addField(`Location Difficulty`, `${diff}`)
                .addField(`Max Possible Reward Outcome Per User`, `$${pglibrary.commafy(curLoc.maxreward)}`)
                .addField('Required Equipment', `${reqs}`)
                .addField(`Optional Equipment`, `${optReqs}`)
                .addField(`Location Availability`, `${avail}`)
                .addField(`Time to Complete`, `Takes ${curLoc.timetocomplete} hour(s) to finish`)
                .addField(`Total Cost of Equipment`, `Required Equipment Cost: $${pglibrary.commafy(reqEqpCost)}, Optional Equipment Cost: $${pglibrary.commafy(optEqpCost)}`);
                message.channel.send({content: `<@${message.author.id}>`, embeds: [embed]});
            }
        }
    }
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

async function IsUserAlreadyInAHeist(userId,guildId){
    bool = false;
    dirArr = fs.readdirSync(`./heists/`);
    dirArr.forEach(file => {
        if(file.includes(userId) && file.includes(guildId)){
            bool = true;
        }
        if(!bool && file.includes(guildId)){ // if the user is not the host but is apart of another
            heistData = JSON.parse(fs.readFileSync(`./heists/${file}`));
            for(i=0;i<heistData.users.length;i++){
                if(heistData.users[i].user == userId){
                    bool = true;
                }
            }
        }
    });
    return bool;
}

async function StartHeist(userId,guildId,message,bot){
    heistFile = JSON.parse(fs.readFileSync(`./heists/heist-${userId}-${guildId}.json`));
    host = heistFile.users.find(user => user.host);
    if(typeof host === 'undefined'){return;}
    heistFile.started = true;
    heistFile.date = Date.now();
    hchannel = bot.guilds.cache.get(heistFile.server).channels.cache.get(heistFile.channel);
    console.log(hchannel);
    hchannel.send(`<@${userId}>, You have started the Heist, Time Until Heist is Finished: ${heistFile.location.timetocomplete} Hour(s)`);
    await saveHeistFile(`heist-${userId}-${guildId}`,heistFile);
    setTimeout(() => heisthandler.FinishHeist(userId,guildId,bot),3600000 * heistFile.location.timetocomplete)
}

async function HeistStatus(message,bot){
    file = `heist-${message.author.id}-${message.guild.id}.json`;
    console.log(file);
    if(!fs.existsSync(`./heists/${file}`)){
        heistFiles = fs.readdirSync('./heists');
        heistFiles.forEach(async file => {
            if(file.startsWith('heist-') && file.endsWith('.json') && file != 'heist.json'){
                fileData = JSON.parse(fs.readFileSync(`./heists/${file}`));
                user = fileData.users.find(usr => usr.userid === message.author.id);
                if(typeof user === 'undefined'){
                    message.channel.send(`<@${message.author.id}>, You are not apart of a Heist`);
                    return;
                }
                embed = createStatusEmbed(fileData,bot);
                message.channel.send({content:`<@${message.author.id}>`, embeds:[embed]});
                return;
            }
        });
    } else {
        heistData = JSON.parse(fs.readFileSync(`./heists/${file}`));
        embed = createStatusEmbed(heistData,bot);
        message.channel.send({content:`<@${message.author.id}>`, embeds:[embed]});
        return;
    }
    
}

function createStatusEmbed(data,bot){
    host = data.users.find(usr => usr.host);
    users = "";
    data.users.forEach(user => {
        users += `${user.name}, `;
    })
    if(data.users.length == 1){
        users = host.name;
    }
    embed = new MessageEmbed()
    .setTitle(`Heist at ${data.location.name} by ${host.name}`)
    .addFields(
        {name: 'Heist Started', value: `${data.started.toString().charAt(0).toUpperCase() + data.started.toString().slice(1)}`},
        {name: "Max Payout Per User", value: `$${pglibrary.commafy(data.location.maxreward)}`},
        {name: "Users in Heist", value:users},
        {name: "Time for Heist to Complete", value:`${data.location.timetocomplete} hour(s)`}
    )
    .setAuthor(bot.user.username, bot.user.displayAvatarURL())
    .setColor(`AQUA`);
    return embed;
}

async function JoinHeist(userId, message ,bot){
    targetUser = message.mentions.users.first();
    if(typeof targetUser === 'undefined'){
        message.channel.send(`<@${userId}>, Please Mention a Host of a Heist to join.`);
        return;
    }
    if(!fs.existsSync(`./heists/heist-${targetUser.id}-${message.guild.id}.json`)){
        message.channel.send(`<@${userId}>, That user is not in a heist or is not a host.`);
        return;
    }
    targetUserHeist = JSON.parse(fs.readFileSync(`./heists/heist-${targetUser.id}-${message.guild.id}.json`));
    if(targetUserHeist.started){
        message.channel.send(`<@${userId}>, That Heist has already started!`);
        return;
    }
    if(targetUserHeist.users.length == 4){
        message.channel.send(`<@${userId}>, this Heist has reached its max limit for players`);
        return;
    }
    guildInv = await masterdb.getGuildJson(message.guild.id,"heistinventories");
    usrInv = guildInv.filter(user => {
        user.user === userId
    });
    itmMatch = 0;
    targetUserHeist.location.reqs.forEach(req => {
        if(usrInv.inv.includes(req)){
            itmMatch++;
        }
    });
    if(itmMatch != targetUserHeist.location.reqs.length){
        message.channel.send(`<@${userId}>, You do not have the required items for this heist!`);
        return;
    }
    userStruct = {userid:userId,host:false,name:message.author.username};
    targetUserHeist.users.push(userStruct);
    message.channel.send(`<@${userId}>, You have joined <@${targetUser.id}>'s Heist`);
    return;
}

async function CancelHeist(userId,message,bot){
    userFile = `heist-${userId}-${message.guild.id}.json`;
    if(!fs.existsSync(`./heists/${userFile}`)){
        message.channel.send(`<${userId}>, You are not in a heist or not a host.`);
        return;
    }
    heistData = JSON.parse(fs.readFileSync(`./heists/${userFile}`));
    if(heistData.started){
        message.channel.send(`<@${userId}>, This Heist has already started!`);
        return;
    }
    bot.guilds.cache.get(heistData.server).channels.cache.get(heistData.channel).delete();
    fs.unlinkSync(`./heists/${userFile}`);
    message.channel.send(`<@${userId}>, You have canceled the heist.`);
    return;
}