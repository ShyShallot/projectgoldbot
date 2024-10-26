// This bot was made by ShyShallot for the Project Gold Discord Server: https://discord.gg/cKfrEX7
// Find the github for the discord bot here: https://github.com/ShyShallot/projectgoldbot
const { Client, Intents, MessageEmbed, MessageAttachment } = require('discord.js'); // Each thing in the Curly Brackets are special things we want to use
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] }); // this handles events the bot checks for and receives from the API
const hostconfig = require('./config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const talkedRecently = new Set(); // unused for cooldown
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); // read our commands folder for every command file
const pglibrary = require("./libraryfunctions.js");
const points_manager = require('./points/manager');
const levels = require('./levels/level_handler');
const masterdb = require('./master-db/masterdb');
const maths = require('mathjs');
const heisthandler = require('./heists/heisthandler');
const { LogAction } = require('./logfunctions.js');
var started = false;
bot.commands = new Map(); // New Array for our commands
const cusGuildCache = [];
bot.on('ready', async () => { // Runs everything inside when the bot has successfully logged in and is active
    startTime = Date.now();
    console.log(`Starting Bot`);
    for(const guild of bot.guilds.cache){
        cusGuildCache.push(guild[0]);
    }
    bot.user.setActivity(hostconfig.game, {type: 'PLAYING'}); // Set our game status
    console.log(`Set Activity to: ${bot.presence.activities[0].type} ${hostconfig.game}`);
    for (const file of commandFiles) { // for every file in our commandFiles Mapping
        const command = require(`./commands/${file}`); // load the data of the file into memory 
        if(!command.active){continue;}

        if(command.nicks != undefined){
            command.nicks.forEach(nick => {
                bot.commands.set(nick, command);
            })
        }
        bot.commands.set(command.name, command); // add our commands to our array
    }
    console.log(`Added Commands to Array`);
    points_manager.setBot(bot);
    levels.setBot(bot);
    console.log(cusGuildCache, cusGuildCache.length);
    await masterdb.connect()
    for(const curGuild of cusGuildCache){
        console.log(`Running Setup for Server: ${bot.guilds.cache.get(curGuild).name}`);
        console.log(curGuild)
        await masterdb.setup(curGuild,bot)
    }

    Economy() // handle our encomy functions for stuff that has to calculate every so often*/
    started = true
    
    console.log(`PG Bot Ready Which took: ${Date.now() - startTime}ms`);

});

bot.on('guildCreate', async (guild) => {
    await masterdb.setup(guild.id,bot)
})

bot.on('guildMemberAdd', async member => { // When a someone joins the server
    console.log(`User has joined`);
    const name = member.user.username;
    console.log(name);
    const welcomeEmbed = new MessageEmbed()
        .setTitle(`Welcome ${name} to Project Gold`)
        .setColor(0x00AE86)
        .setDescription("Welcome to the Project Gold Discord Server, Please Read <#631010878568923136> before continuing for server links and rules.")
        .setThumbnail("https://i.imgur.com/7s7AuxI.png");
    console.log(member.guild.id);
    guildConfig = await masterdb.getGuildConfig(member.guild.id)
    if(guildConfig.welcomeChannel == undefined){
        pglibrary.ChannelLog("Welcome channel is not set","Unset Setting",bot,member.guild.id);
        return;
    }
    member.guild.channels.cache.get(guildConfig.welcomeChannel).send({content: `${name} ${guildConfig.welcomeMessage}`, embeds: [welcomeEmbed] });
    const defaultRole = member.guild.roles.cache.get(guildConfig.defaultRole)
    if (defaultRole !== undefined){
        console.log(defaultRole)
        member.roles.add(defaultRole)
    } else {
        LogAction(`No Default role is Set please use ${guildConfig.prefix}defaultrole to add one`, `No Default Role`, bot, member.guild.id)
    }
    LogAction(`User: ${name} has joined the Server`, `Member Join`, bot, member.guild.id)
});

bot.on('guildMemberRemove', async member => { // When someone leaves the server
    console.log(member);
    console.log(`User has left`);
    const name = member.user.displayName
    console.log(name);
    const welcomeEmbed = new MessageEmbed()
        .setTitle(`${name} has left :(`)
        .setColor(0x00AE86)
        .setDescription("We wish the best, thanks for stopping by :).")
        .setThumbnail("https://i.imgur.com/7s7AuxI.png");
    guildConfig = await masterdb.getGuildConfig(member.guild.id)
    if(guildConfig.welcomeChannel == undefined){
        pglibrary.ChannelLog("Welcome channel is not set","Unset Setting",bot,member.guild.id);
        return;
    }
    member.guild.channels.cache.get(guildConfig.welcomeChannel).send({content: `${name} ${guildConfig.leaveMessage}`, embeds: [welcomeEmbed] });
    LogAction(`User: ${name} has left the Server`, `Member Leave`, bot, member.guild.id)
});



bot.on('error', console.error); // prevent bot from crashing and log error to console
bot.on('messageCreate', async (message) =>{ // when someone sends a message
    if (message.author.bot){ // if the message is sent by a bot don't even bother
        return;
    }
    if(!started){
        return;
    }
    var guildId = message.guild.id;
    guildConfig = await masterdb.getGuildConfig(guildId)
    await points_manager.messagePoints(message.author.id,guildId);
    await levels.messageXP(message.author.id,message,guildId);
    await masterdb.editUserValue(guildId,message.author.id,"cooldown", 1)
    setTimeout( () => removeEarnCooldown(guildId,message.author.id), guildConfig.earn_cooldown)
    const args = message.content.slice(guildConfig.prefix.length).split(/ +/g); // basic argument by spliting a message by spaces, with the first argument given is args[0]
    const command = args.shift().toLowerCase(); 
    if (!message.content.startsWith(guildConfig.prefix) || message.author.bot){ // if the message doesn't start with our prefix don't bother
        return;
    }

    // Base for adding commands: if(command === "name"){
    //  bot.commands.get("name").execute(message, args, bot)
    //}
    cmd = bot.commands.get(command);
    console.log(`Command to Run: ${command}`);
    if(typeof cmd === 'undefined'){
        return
    }
    if(cmd.admin){
        if(message.member.roles.cache.find(role => role.name === guildConfig.adminRole)){
            cmd.execute(message,args,bot,guildId);
            return;
        } else {
            if(message.guild.ownerId == message.author.id){
                cmd.execute(message,args,bot,guildId);
                return;
            }
        }
    } else if(cmd.owner){
        if(message.guild.ownerId == message.author.id){
            cmd.execute(message,args,bot,guildId);
            return;
        }
    } else {
        await cmd.execute(message,args,bot,guildId);
        return;
    }
});

bot.on('messageDelete', async(message) => {
    if (message.author.id === bot.user.id){
        return
    }
    LogAction(message.content,`Message by ${message.author.tag} was deleted`, bot, message.guild.id)
})

bot.on('messageUpdate', async (oldMessage, newMessage) => {
    if (oldMessage.author.id === bot.user.id){
        return
    }
    if(oldMessage.content == "" && newMessage.content == ""){
        return
    }
    LogAction(`Old Message: ${oldMessage.content} \n New Message: ${newMessage.content}`,`${newMessage.author.displayName} Updated their Message`, bot, oldMessage.guild.id)
})

bot.login(hostconfig.token);

async function Economy(){ // Janky as fuck but works
    await pglibrary.sleep(1000);
    while (true) {
        //await Heists().then((status)=>{
        //   console.log(status);
        //}).catch((err) => {console.error(err);});
        //await Jackpot(false).then((status)=>{
        //    console.log(status);
        //}).catch((err) => {console.error(err);}); 
        //await StockMarket().then(()=>{
        //    console.log(`Finished Stock Market Function`);
        //}).catch((err) => {console.error(err);});
        cusGuildCache.forEach(async guild =>{
            console.log("GUILD ID: " + guild);
            await points_manager.checkPausedTimers(guild);
        });
        await pglibrary.sleep(5000);
    }
}



function UpdateDate(){ // update the date
    var date = new Date();
    var hour = date.getHours();
    var day = date.getDay();
    console.log("Updating Date to: " + date, day, hour);
    return [day, hour];
}

// Stock Market Related Functions

async function StockMarket() {
    console.log("Starting Stock Market");
    var stockmarket = GrabStockMarketData();
    console.log(`Adding Guilds to Stockmarket`);
    cusGuildCache.forEach(async curGuild => {
        console.log(`Adding ${curGuild}`);
        guildConfig = await masterdb.getGuildConfig(curGuild)
        //console.log(guildConfig);
        if(typeof guildConfig.stockname !== 'undefined'){
            console.log(`Guild ${curGuild} has a stock prefix`);
            console.log(guildConfig.stockname);
            if(!stockmarket.stocks.some(stock => stock.name === guildConfig.stockname)){
                console.log(`Guild ${curGuild} does not have a stock`);
                stockmarket.stocks.push({"name":guildConfig.stockname,value:[2000],"owners":[]});
                console.log(stockmarket.stocks);
            }
        }
    });
    await pglibrary.WriteToJson(stockmarket, './stockmarket.json').then((status) => {console.log(status)});
    if (stockmarket.stockmarketactive == 0) {
        if(typeof stockmarket.lastupdate === 'undefined'){
            return;
        }
        if(Date.now() >= stockmarket.lastupdate + (stockmarket.updateinterval * 3600000) && stockmarket.active == 0){
            EnableStockMarket();
        }
        return;
    }
    console.log(`Updating Stock Market`);
    var finalstocks = [];
    for (i=0;i<stockmarket.stocks.length;i++) {
        console.log(`Running Calculations for Stock: ${stockmarket.stocks[i].name}`);
        var stock = stockmarket.stocks[i];
        console.log(`Calculating Stock price for ${stock.name}`);
        newstockprice = await CalculateStockPrice(stock);
        console.log(`Final Stock Price: ${newstockprice}`);
        owners = stock.owners;
        stock.value.push(newstockprice)
        var companystock = {"name": stock.name, "value":stock.value, "owners": owners};
        console.log(`Stock for: ${stock.name}`);
        console.log(companystock);
        finalstocks.push(companystock); 
        console.log(`Final Stock Array`);
        console.log(finalstocks);
    }
    console.log(`Logging final stock array`);
    console.log(finalstocks);
    stockmarket.stockmarketactive = 0;
    stockmarket.lastupdate = Date.now();
    stockmarket.stocks = finalstocks; 
    await pglibrary.WriteToJson(stockmarket, './stockmarket.json').then((status) => {console.log(status)});
    console.log(`Setting Up timer for reenable`);
    setTimeout(EnableStockMarket, 3600000 * stockmarket.updateinterval);
    console.log(`End of StockMarket func`);
}

function GrabStockMarketData(){
    stockmarket = fs.readFileSync(`stockmarket.json`, 'utf-8');
    data = JSON.parse(stockmarket);
    return data;
}

async function EnableStockMarket(){
    var stockmarket = GrabStockMarketData();
    if(stockmarket.stockmarketactive == 1){
        return;
    }
    console.log(`Stock Market ready to update`);
    stockmarket.stockmarketactive = 1;
    await pglibrary.WriteToJson(stockmarket, './stockmarket.json').then((status) => {console.log(status)});
}

async function CalculateStockPrice(stock) {
    console.log(stock);
    console.log(stock.value, stock.value[stock.value.length-1]);
    mean = maths.mean(stock.value);
    console.log(`Mean ${mean}`);
    randomShock = Math.round(mean*Math.random()/10);
    if(randomShock == 0){
        randomShock = 1;
    }
    finalValue = Math.round(stock.value[stock.value.length-1] + randomShock);
    console.log(`Final Value: ${finalValue}, Random Shock: ${randomShock}`);
    if(finalValue < 0 || !isFinite(finalValue)){
        finalValue = 0;
    }
    return finalValue;
}

async function removeEarnCooldown(guildId, userId){
    await masterdb.editUserValue(guildId,userId,"cooldown", 0)
}

async function StockCrash(stock) {
    console.log(`Stock ${stock.name} reached crashing point`);
    var stockmarket = GrabStockMarketData();
    for (i = 0, l = stockmarket.stocks.length; i < l; i++){
        curStockIndex = i
        console.log(`Current Stock Index: ${curStockIndex}`);
        curStock = stockmarket.stocks[curStockIndex];
        console.log(`Current Stock`);
        console.log(curStock);
        if (curStock.name == stock.name) {
            newstockinfo = {"name": stock.name, "price": 2000, "owners": []};
            console.log(newstockinfo);
            console.log(`Removing current stock ${stock.name} off of index`);
            stockmarket.stocks.splice(curStockIndex, 1);
            console.log(`Pushing new stock info to array`);
            stockmarket.stocks.push(newstockinfo);
            console.log(`Writing to Stockmarket`);
            await pglibrary.WriteToJson(stockmarket, './stockmarket.json').then((status) => {console.log(status)});
            return true;
        }
    }
}

function GrabStocksinOwnership(stock) { // Modified Max User Stocks function
    var stockmarket = GrabStockMarketData();
    ownedStocks = 0;
    console.log(ownedStocks)
    for(i = 0, l = stock.owners.length; i < l; i++){
        owner = stock.owners[i];
        console.log(owner);
        ownerAmount = owner.amount;
        console.log(ownerAmount);
        ownedStocks += ownerAmount;
        console.log(ownedStocks);
    }
    console.log(ownedStocks);
    return ownedStocks;
}

// Heist Related Functions

async function Heists(){
    console.log(`Checking for Ongoing Heists`);
    await CheckHeists();
    return Promise.resolve(`Finished Heist Handler Function`);
}

async function CheckHeists(){
    heistFiles = fs.readdirSync('./heists');
    heistFiles.forEach(async file => {
        if(file.startsWith('heist-') && file.endsWith('.json') && file != 'heist.json'){
            fileData = JSON.parse(fs.readFileSync(`./heists/${file}`));
            console.log(fileData);
            if(fileData.started && Date.now() >= (fileData.location.timetocomplete * 3600000) + fileData.date){
                host = fileData.users.find(usr => usr.host === true);
                heisthandler.FinishHeist(host.userid,fileData.server,bot);
            } else if(fileData.started){
                guildLoc = await masterdb.getGuildJson(fileData.server,'locations');
                guildLoc.forEach(loc => {
                    if(loc == fileData.location.name && loc.available){
                        loc.available = false;
                    }
                });
                masterdb.writeGuildJsonFile(fileData.server,'locations',guildLoc);
            }
        }
    });
    return Promise.resolve(`Done`);
}

function HeistLocationData(){
    return JSON.parse(fs.readFileSync('./heists/locations.json'));
}

async function HeistsLocationsSetup(guildId){
    defaultLocations = HeistLocationData();
    console.log(`Setting Up Locations for Guild: ${bot.guilds.cache.get(guildId).name}`);
    fileStatus = await masterdb.doesFileExist(guildId,"locations");
    if(!fileStatus){
        for(i=0;i<defaultLocations.length;i++){
            defaultLocations[i].madeunavailable = undefined;
            defaultLocations[i].available = true;
        }
        await masterdb.writeGuildJsonFile(guildId,"locations",defaultLocations).then((status) =>{
            console.log(status);
        }).catch((err)=>{
            console.error(err);
            return Promise.reject(err);
        });
    }
    cooldownStat = await masterdb.doesFileExist(guildId,'heistcooldowns');
    if(!cooldownStat){
        emptArr = [];
        await masterdb.writeGuildJsonFile(guildId,'heistcooldowns',emptArr).then((status) =>{
            console.log(status);
        }).catch((err)=>{
            console.error(err);
            return Promise.reject(err);
        });
    }
    return Promise.resolve(`Finished Location Setup`);
}
