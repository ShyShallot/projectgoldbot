// This bot was made by ShyShallot for the Project Gold Discord Server: https://discord.gg/cKfrEX7
// Find the github for the discord bot here: https://github.com/ShyShallot/projectgoldbot
const { Client, Intents, MessageEmbed, MessageAttachment } = require('discord.js'); // Each thing in the Curly Brackets are special things we want to use
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] }); // this handles events the bot checks for and receives from the API
const hostconfig = require('./config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const talkedRecently = new Set(); // unused for cooldown
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); // read our commands folder for every command file
const pglibrary = require("./libraryfunctions.js");
const sqlconfig = require('./sql.json');
const SQL = require('mssql');
const points_manager = require('./points/manager');
const levels = require('./levels/level_handler');
const masterdb = require('./master-db/masterdb');
const maths = require('mathjs');
const heisthandler = require('./heists/heisthandler');
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
        bot.commands.set(command.name, command); // add our commands to our array
    }
    console.log(`Added Commands to Array`);
    points_manager.setBot(bot);
    levels.setBot(bot);
    //console.log(cusGuildCache, cusGuildCache.length);
    for(const curGuild of cusGuildCache){
        //console.log(curGuild);
        await points_manager.setup(false,curGuild).then(()=>{
            console.log(`Finished Point Setup for ${bot.guilds.cache.get(curGuild).name}`);
        }).catch((err) => {
            console.error(err);
        });
        await points_manager.ItemsSetup(curGuild).then(()=>{
            console.log(`Finished Item Setup for ${bot.guilds.cache.get(curGuild).name}`);
        }).catch((err) => {
            console.error(err);
        });
        await levels.setup(false,curGuild).then(() => {
            console.log("Level Manager Setup Done");
        }).catch((err) => {
            console.error(err)
        });
        await masterdb.getGuildJson(curGuild,"config").then((guildConfig) => {
            console.log("Guild Has A Config");
            if(!guildConfig.stockname){
                pglibrary.ChannelLog(`Warning Server Stock Name is Not Set, Use ${guildConfig.prefix}stockname to set it`,'Unset Config Value',bot,curGuild);
            }
        }).catch((err) => {
            console.error(err);
            console.log(`Guild Most Likley Doesnt Have a Config Creating`);
            defaultconfig = {"serverid":curGuild,"newUserMessages":[{"Welcome":"<@313159590285934595>, a new user has joined"},{"Leave":" has left :("}],"prefix":"pg","mincoinbet":"0"}
            masterdb.writeGuildJsonFile(curGuild,"config",defaultconfig)
        });
        await HeistsLocationsSetup(curGuild).then((status) => {
            console.log(status);
        })
    }
    console.log(`PG Bot Ready Which took: ${Date.now() - startTime}ms`);
    Economy() // handle our encomy functions for stuff that has to calculate every so often
});


bot.on('guildMemberAdd', member => { // When a someone joins the server
    console.log(`User has joined`);
    const name = member.user.username;
    console.log(name);
    const welcomeEmbed = new MessageEmbed()
        .setTitle(`Welcome ${name} to Project Gold`)
        .setColor(0x00AE86)
        .setDescription("Welcome to the Project Gold Discord Server, Please Read <#631010878568923136> before continuing for server links and rules.")
        .setThumbnail("https://i.imgur.com/7s7AuxI.png");
    masterdb.getGuildJson(member.guild.id,"config").then((guildConfig) =>{
        bot.guilds.cache.get(member.guild.id).channels.cache.get(guildConfig.welcomeChannel).send({content: `${name} ${guildConfig.newUserMessages.Welcome}`, embeds: [welcomeEmbed] });
    }).catch((err) => {
        console.error(err);
    });
    points_manager.addUser(member.user,member.guild.id);
});

bot.on('guildMemberRemove', member => { // When someone leaves the server
    console.log(member);
    console.log(`User has left`);
    const name = member.user.username
    console.log(name);
    const welcomeEmbed = new MessageEmbed()
        .setTitle(`${name} has left :(`)
        .setColor(0x00AE86)
        .setDescription("We wish the best, thanks for stopping by :).")
        .setThumbnail("https://i.imgur.com/7s7AuxI.png");
    masterdb.getGuildJson(member.guild.id,"config").then((guildConfig) =>{
        bot.guilds.cache.get(member.guild.id).channels.cache.get(guildConfig.welcomeChannel).send({content: `${name} ${guildConfig.newUserMessages.Leave}`, embeds: [welcomeEmbed] });
    }).catch((err) => {
        console.error(err);
    });
    points_manager.removeUser(member.user.id,member.guild.id);
});



bot.on('error', console.error); // prevent bot from crashing and log error to console
bot.on('messageCreate', async (message) =>{ // when someone sends a message
    if (message.author.bot){ // if the message is sent by a bot don't even bother
        return;
    }
    guildId = message.guild.id;
    guildConfig = await masterdb.getGuildJson(guildId,'config').catch((err) => {console.error(err);return});
    await points_manager.messagePoints(message.author.id,guildId);
    //levels.messageXP(message.author.id,message,guildId);
    const args = message.content.slice(guildConfig.prefix.length).split(/ +/g); // basic argument by spliting a message by spaces, with the first argument given is args[0]
    const command = args.shift().toLowerCase(); 
    //console.log(command);
    if (!message.content.startsWith(guildConfig.prefix) || message.author.bot){ // if the message doesn't start with our prefix don't bother
        return;
    }

    // Base for adding commands: if(command === "name"){
    //  bot.commands.get("name").execute(message, args, bot)
    //}
    cmd = bot.commands.get(command);
    console.log(`Command to Run: ${command}`);
    if(typeof cmd === 'undefined'){
        switch (command){
            case 'cf':
            case 'coinflip':
                bot.commands.get("coinflip").execute(message,args,bot);
                break;
            case 'dep':
            case 'deposit':
                bot.commands.get("deposit").execute(message,args,bot);
                break;
            case 'bal':
            case 'balance':
                bot.commands.get("balance").execute(message,args,bot);
                break;
            case 'inv':
            case 'inventory':
                bot.commands.get("inventory").execute(message,args,bot);
                break;
            case 'lb':
            case 'leaderboard':
                bot.commands.get("leaderboard").execute(message,args,bot);
                break;
            case 'lvllb':
                bot.commands.get("levellb").execute(message,args,bot);
                break;
        }
    }
    if(cmd.admin){
        if(message.member.roles.cache.find(role => role.name === guildConfig.modrole)){
            cmd.execute(message,args,bot,guildId);
            return;
        } else {
            if(message.guild.ownerId == message.author.id){
                cmd.execute(message,args,bot,guildId);
                return;
            }
        }
    } else {
        await cmd.execute(message,args,bot,guildId);
        return;
    }
});
bot.login(hostconfig.token);

async function Economy(){ // Janky as fuck but works
    await pglibrary.sleep(1000);
    while (true) {
        await Heists().then((status)=>{
           console.log(status);
        }).catch((err) => {console.error(err);});
        //await Jackpot(false).then((status)=>{
        //    console.log(status);
        //}).catch((err) => {console.error(err);}); 
        await StockMarket().then(()=>{
            console.log(`Finished Stock Market Function`);
        }).catch((err) => {console.error(err);});
        if(hostconfig.sql == 1){
            await ClearSQLDB(); // Temp thing till i figure out SQL more
            await WritetoSQLDB();
        }
        cusGuildCache.forEach(async guild =>{
            await points_manager.checkPausedTimers(guild);
        });
        await pglibrary.sleep(5000);
    }
}

// Jackpot Functions Related Functions
async function UpdateJackpotData(guildId){ // update the jackpot data array
    console.log(guildId);
    fileStatus = await masterdb.DoesFileExist(guildId,"jackpot");
    if(fileStatus){
        return await masterdb.getGuildJson(guildId,"jackpot");
    } else {
        file = {"raffleactive":false,"rafflepot":0,"lastraffleday":0,"users":[]};
        await masterdb.writeGuildJsonFile(guildId,'jackpot',file).then(() => {
            console.log("Jackpot File was saved");
        }).catch((err) => {console.error(err)});
        return file;
    }
}

async function Jackpot(forced) { // Changed to a raffle but am too lazy to update names -- Dyl 8/28/2021 also this function is a janky mess
    console.log(`Checking For Jackpot Status`);
    //console.log(cusGuildCache);
    for(const curGuild of cusGuildCache){
        console.log(`Running Jackpot for Guild: ${curGuild}`);
        guildConfig = await masterdb.getGuildJson(curGuild,"config");
        jackpotData = await UpdateJackpotData(curGuild);
        //console.log(`Jackpot Data: ${jackpotData}`);
        if(typeof jackpotData === 'undefined'){
            UpdateJackpotData(curGuild);
            return;
        }
        //console.log(jackpotData);
        var [day, hour] = UpdateDate(); // set a var day and hour from the return from UpdateDate()
        console.log(day, hour);
        if (forced || RaffleValid(jackpotData, day)) { // if the Jackpot function was forced or the Raffle is Valid to start
            if (jackpotData.raffleactive == false){ // if a raffle is not active
                console.log(hour, day);
                console.log(`Raffle Not Active Might Start One`);
                if ((forced) && jackpotData.raffleactive == false || hour >= 12 && hour <= 21 && jackpotData.raffleactive == false) { // the Jackpot function was forced and their is no raffle active OR its 12pm and their is no raffle active
                    //pglibrary.ChannelLog(`Starting Jackpot`, 'Automated Function', bot);
                    console.log(`Starting Jackpot`);
                    var startingAmounts = [500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000]; // an array of defined starting amounts to then randomly pick from
                    var startingamountIndex = pglibrary.getRandomInt(startingAmounts.length); // pick a random number ranging from 0 to the amount of entry's in our startingAmounts array
                    var startingamount = startingAmounts[startingamountIndex]; // our final starting amount is equal to our startingAmounts array's picked index
                    console.log(startingamount);
                    var startingamountMultipliers = [0.95, 1, 1.15, 1.2, 1.35, 1.5, 1.65, 1.75, 2]; // this is pretty much the same process as picking our startingAmount
                    var startingamountMultipliersIndex = pglibrary.getRandomInt(startingamountMultipliers.length);
                    var startingMultiplier = startingamountMultipliers[startingamountMultipliersIndex];
                    var bigmulti = Math.random(); // get a random number ranging from 0 to 1, as an example it could return 0.57124867 and so on
                    console.log(bigmulti);
                    if (bigmulti >= 0.98) { // if our random number is greater than or equal to 0.98, pretty much a 2% chance
                        console.log(`Big Multiplier`);
                        var startingMultiplier = 5; // if above is true set our multiplier to 5 no matter what
                    }
                    console.log(startingMultiplier);
                    if(!guildConfig.jackpotrole){
                        guildConfig.jackpotrole = "PLEASE SET JACKPOT ROLE"
                    }
                    if(typeof guildConfig.econchannel === 'undefined' || !guildConfig.econchannel){
                        jackpotData.raffleactive = false
                        return;
                    }
                    const embed = new MessageEmbed() // create a new embed var
                        .setTitle("Raffle")
                        .setAuthor(`${bot.user.username}`, bot.user.displayAvatarURL())
                        .setColor("#2bff00")
                        .setDescription(`<@&${guildConfig.jackpotrole}>, a Raffle has been started, Raffle Pot is: ${Math.round(startingamount * startingMultiplier)} points.`);
                    bot.guilds.cache.get(curGuild).channels.cache.get(guildConfig.econchannel).send({ content: `<@&${guildConfig.jackpotrole}>`, embeds: [embed] }); 
                    jackpotData.raffleactive = true;
                }
            } else { // else if there is a raffle active
                jackpotData = await UpdateJackpotData(curGuild);
                console.log(`Raffle Currently Active`);
                console.log(hour, day);
                if ((forced) && jackpotData.raffleactive == true || hour >= 22 && jackpotData.raffleactive == true) { // the Jackpot function was forced and their is a raffle active OR its 10pm and their is a raffle active
                    //pglibrary.ChannelLog(`Stopping Jackpot`, 'Automated Function', bot);
                    console.log('Stop Jackpot');
                    if(jackpotData.users.length >= 5){
                        if(!guildConfig.jackpotrole){
                            guildConfig.jackpotrole = "PLEASE SET JACKPOT ROLE"
                        }
                        if(typeof guildConfig.econchannel === 'undefined'){
                            jackpotData.raffleactive = false
                            return;
                        }
                        randomPick = pglibrary.getRandomInt(jackpotData.users.length);
                        console.log(`Pick: ${randomPick}`);
                        winner = data.users[randomPick];
                        points_manager.giveUserPoints(winner.id,jackpotData.rafflepot,cash,true,curGuild);
                        winEmbed = new MessageEmbed()
                        .setTitle("Raffle")
                        .setAuthor(`${winner.username}`, winner.displayAvatarURL())
                        .setColor("#2bff00")
                        .setDescription(`<@&${jackpotid}>, <@${winner.id}> has won the raffle and has gained ${gain} points!`)
                        bot.guilds.cache.get(curGuild).channels.cache.get(guildConfig.econchannel).send({ content: `<@&${jackpotid}>`, embeds: [embed] }); 
                        // add raffle channel id to per server config
                        console.log("Resetting Jackpot.JSON");
                        ResetRaffleJson(data);
                    }
                    //await sleep(20000);
                } else {
                    //await sleep(20000);
                }
            }
        } 
        jackpotData = await UpdateJackpotData(curGuild); // update jackpotData to constatly check if a raffle is active or not
        if (forced) { // because the forceraffle function runs the function again and creates essenatilly another instance of it, if the jackpot function was forced stop it, this does not interupt the naturally ran jackpot function
            console.log(`Stopping Forced Raffle Run`);
            return;
        }
    }
    return Promise.resolve(`Finished Jackpot`)
    //await sleep(20000); // wait 20 seconds to keep this from running every possible tick
}

async function ResetRaffleJson(data,guildId) {
    var jsonupdate = {raffleactive: false, rafflepot: 0, lastraffleday: SetLastRaffleDay(data), users: []}; // empty and reset our json file
    masterdb.writeGuildJsonFile(guildId,jackpot,jsonupdate).then(()=>{
        console.log(`Finished Writing to ${guildId}'s Jackpot File`);
        return true;
    }).catch(()=>{
        console.error(`Couldnt Write to Guild ${guildId} Jackpot File, ID could be wrong or file doesnt exist`);
    });
    
}

function RaffleValid(json, day) { // a simple function that checks if the current day is equal to the last day found in jackpot.json
    if (!(json.lastraffleday == day)) {
        console.log(`Raffle is allowed to start. ${json.lastraffleday}, ${day}`);
        return true;
    } else {
        console.log(`Raffle is not allowed to start. ${json.lastraffleday}, ${day}`);
        return false;
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
        guildConfig = await masterdb.getGuildJson(curGuild,"config");
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
    fileStatus = await masterdb.DoesFileExist(guildId,"locations");
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
    cooldownStat = await masterdb.DoesFileExist(guildId,'heistcooldowns');
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



// Database Related Functions

async function ClearSQLDB(){
    console.log("Clearing MSSQL DB");
    var SQLconfig = {
        server: sqlconfig.server,
        user: sqlconfig.user,
        password: sqlconfig.password,
        database: sqlconfig.database,
        port: 1433,
        trustServerCertificate: true,
        options: {
            "encrypt": true
        }
    }
    try{
        var dbConn = new SQL.ConnectionPool(SQLconfig);
        dbConn.connect().then(function() {
            var transaction = new SQL.Transaction(dbConn);
            transaction.begin().then(function (){
                var request = new SQL.Request(transaction);
                request.query('DELETE FROM StockInfo', function(err, result){
                    if(err) {
                        console.log(err);
                    }
                    transaction.commit().then(function (recordSet){
                        console.log(`Cleared Stock Info Table`);
                        console.log(recordSet);
                        dbConn.close();
                    });
                });
            });
        });
    } catch{
        console.log(`Something Went wrong, most likely could not connect to SQL Database`);
    }
    
}

async function WritetoSQLDB() {
    console.log("Writing to MSSQL DB");
    var stockmarket = GrabStockMarketData();

    var SQLconfig = {
        server: sqlconfig.server,
        user: sqlconfig.user,
        password: sqlconfig.password,
        database: sqlconfig.database,
        port: 1433,
        trustServerCertificate: true,
        options: {
            "encrypt": true
        }
    }

    const table = new SQL.Table(`StockInfo`);
    table.create = true;
    table.columns.add('Name', SQL.NVarChar(10), {nullable: true});
    table.columns.add('Price', SQL.Int, {nullable: true});
    console.log(table);
    stockmarket.stocks.forEach(stock => {
        console.log(stock);
        table.rows.add(stock.name, stock.price);
    });
    console.log(table);
    try{
        var dbConn = new SQL.ConnectionPool(SQLconfig);
        dbConn.connect().then(function() {
            var transaction = new SQL.Transaction(dbConn);
            transaction.begin().then(function (){
                var request = new SQL.Request(transaction);
                request.bulk(table, (err, result) => {
                    if(err) {
                        console.log(err);
                    }
                    if(result){
                        console.log(result);
                    }
                    transaction.commit().then(function (recordSet){
                        console.log(recordSet);
                        dbConn.close();
                    });
                });
            });
        });
    } catch{
        console.log(`Something Went wrong, most likely could not connect to SQL Database`);
    }
    
} // https://docs.microsoft.com/en-us/sql/connect/node-js/step-3-proof-of-concept-connecting-to-sql-using-node-js?view=sql-server-ver15
