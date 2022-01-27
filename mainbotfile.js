// This bot was made by ShyShallot for the Project Gold Discord Server: https://discord.gg/cKfrEX7
// Find the github for the discord bot here: https://github.com/ShyShallot/projectgoldbot
const { Client, Intents, MessageEmbed, MessageAttachment } = require('discord.js'); // Each thing in the Curly Brackets are special things we want to use
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] }); // this handles events the bot checks for and receives from the API
const config = require('./config.json'); // basic load of config file
const game = require('./game.json'); // Game Status
const welcome = require('./welcomemessages.json'); // Welcome Messages 
const fs = require('fs'); // File System for JS
const talkedRecently = new Set(); // unused for cooldown
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); // read our commands folder for every command file
const pglibrary = require("./libraryfunctions.js");
const sqlconfig = require('./sql.json');
const SQL = require('mssql');

bot.commands = new Map(); // New Array for our commands
bot.on('ready', () => { // Runs everything inside when the bot has successfully logged in and is active
    console.log('PG Bot Ready');
    console.log(`Current Game: ${game}`);
    bot.user.setActivity(game, {type: 'PLAYING'}); // Set our game status
    for (const file of commandFiles) { // for every file in our commandFiles Mapping
      const command = require(`./commands/${file}`); // load the data of the file into memory 
      bot.commands.set(command.name, command); // add our commands to our array
    }
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
        .setThumbnail("https://i.imgur.com/7s7AuxI.png")
    bot.channels.cache.get(`631012458232021025`).send({content: welcome.Welcome, embeds: [welcomeEmbed] });
});

bot.on('guildMemberRemove', member => { // When someone leaves the server
    console.log(`User has left`);
    const name = member.user.username
    console.log(name);
    const welcomeEmbed = new MessageEmbed()
        .setTitle(`${name} has left :(`)
        .setColor(0x00AE86)
        .setDescription("We wish the best, thanks for stopping by :).")
        .setThumbnail("https://i.imgur.com/7s7AuxI.png")
    bot.channels.cache.get(`631012458232021025`).send({content: `${name} ${welcome.Leave}`, embeds: [welcomeEmbed] });
});



bot.on('error', console.error); // prevent bot from crashing and log error to console
bot.on('messageCreate', (message) =>{ // when someone sends a message
    if (message.author.bot){ // if the message is sent by a bot don't even bother
        return;
    }
    const args = message.content.slice(config.prefix.length).split(/ +/g); // basic argument by spliting a message by spaces, with the first argument given is args[0]
    const command = args.shift().toLowerCase(); 
    const eargs = message.content.slice(config.econprefix.length).split(/ +/g);
    const ecommand = eargs.shift().toLowerCase();
    console.log(command);
    console.log(ecommand);
    AutomatedMessage(message);
    if (message.content.startsWith(config.econprefix)) { // this is to extend UnbelievaBoat's functionality
        switch (ecommand){
            case 'cf':
            case 'coinflip':
                bot.commands.get("coinflip").execute(message, args, bot);
                break;
            case 'raffle':
                bot.commands.get("jackpot").execute(message, args, bot, 0);
                break;
            case 'forceraffle':
                if(message.member.roles.cache.find(role => role.name === config.modrole)){
                    Jackpot(1);
                    message.channel.send(`Forcing Raffle Status`);
                }
                break;
            case 'stocks':
                bot.commands.get("stocks").execute(message, args, bot);
        }
    }
    if (!message.content.startsWith(config.prefix) || message.author.bot){ // if the message doesn't start with our prefix don't bother
        return;
    }

    // Base for adding commands: if(command === "name"){
    //  bot.commands.get("name").execute(message, args, bot)
    //}

    switch (command){
        case 'toggleauto':
            if(message.member.roles.cache.find(role => role.name === config.modrole)){
                bot.commands.get("automsgT").execute(message, args, bot);
            }
            break;
        case 'setgame':
            bot.commands.get("setgame").execute(message, args, bot);
            break;
        case 'setminbet':
            if(message.member.roles.cache.find(role => role.name === config.modrole)){
                bot.commands.get("setminbet").execute(message, args, bot);
            }
            break;
        case 'sui':
            if(message.member.roles.cache.find(role => role.name === config.modrole)){
                bot.commands.get("sui").execute(message,args,bot);
            }
            break;
        case 'heist':
            bot.commands.get("heist").execute(message,args,bot);
            break;
        case 'setlc':
            bot.commands.get("logchannelset").execute(message, args, bot);
            break;
        case 'help':
            bot.commands.get("help").execute(message, args, bot, bot.commands);
            break;
        case 'uptime':
            bot.commands.get("uptime").execute(message, args, bot);
            break;
    }
});
bot.login(config.token);

function AutomatedMessage(message) { // this is to keep annoying as people from asking annoying questions you can remove this or use it as a base for automoding 
    //const automessge = require(`./automatedmessagestatus.json`);
    //if (automessge.state == "1"){
        
    //}
}

async function Economy(){ // Janky as fuck but works
    while (true) {
        await Heists();
        await Jackpot(0); // Init Raffle
        await StockMarket();
        if(config.sql == 1){
            await ClearSQLDB(); // Temp thing till i figure out SQL more
            await WritetoSQLDB();
        }
        await pglibrary.sleep(5000);
    }
}

// Jackpot Functions Related Functions
async function Jackpot(forced) { // Changed to a raffle but am too lazy to update names -- Dyl 8/28/2021 also this function is a janky mess
    console.log(`Checking For Jackpot Status`);
    var jackpotData = UpdateJackpotData(); // define jackpotData which is an array
    console.log(jackpotData);
    var [day, hour] = UpdateDate(); // set a var day and hour from the return from UpdateDate()
    console.log(day, hour);
    if (forced == 1 || RaffleValid(jackpotData, day)) { // if the Jackpot function was forced or the Raffle is Valid to start
        if (jackpotData.raffleactive == 0){ // if a raffle is not active
            console.log(hour, day);
            console.log(`Raffle Not Active Might Start One`);
            if ((forced == 1) && jackpotData.raffleactive == 0 || hour >= 12 && jackpotData.raffleactive == 0) { // the Jackpot function was forced and their is no raffle active OR its 12pm and their is no raffle active
                pglibrary.ChannelLog(`Starting Jackpot`, 'Automated Function', bot);
                console.log(`Starting Jackpot`);
                await bot.commands.get("jackpot").execute(null, null, bot, 1); // run jackpot.js with a state of 1
                //await sleep(20000); // wait 20 seconds
            } else { // if neither of those conditions is true
                //await sleep(20000);
            }
        } else { // else if there is a raffle active
            jackpotData = UpdateJackpotData();
            console.log(`Raffle Currently Active`);
            console.log(hour, day);
            if ((forced == 1) && jackpotData.raffleactive == 1 || hour >= 22 && jackpotData.raffleactive == 1) { // the Jackpot function was forced and their is a raffle active OR its 10pm and their is a raffle active
                pglibrary.ChannelLog(`Stopping Jackpot`, 'Automated Function', bot);
                console.log('Stop Jackpot');
                await bot.commands.get("jackpot").execute(null, null, bot, 0); // run jackpot.js with a state of 0, telling it to stop
                //await sleep(20000);
            } else {
                //await sleep(20000);
            }
        }
    } 
    jackpotData = UpdateJackpotData(); // update jackpotData to constatly check if a raffle is active or not
    if (forced == 1 ) { // because the forceraffle function runs the function again and creates essenatilly another instance of it, if the jackpot function was forced stop it, this does not interupt the naturally ran jackpot function
        console.log(`Stopping Forced Raffle Run`);
        return;
    }
    //await sleep(20000); // wait 20 seconds to keep this from running every possible tick
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

function UpdateJackpotData(){ // update the jackpot data array
    jackpot = fs.readFileSync(`jackpot.json`, 'utf-8');
    data = JSON.parse(jackpot);
    return data;
}

// Stock Market Related Functions

async function StockMarket() {
    console.log("Starting Stock Market");
    var stockmarket = GrabStockMarketData();
    console.log(stockmarket);
    if (stockmarket.stockmarketactive == 1) {
        pglibrary.ChannelLog(`Updating Stock Market`, 'Automated Function', bot);
        console.log(`Updating Stock Market`);
        var finalstocks = [];
        for (var i = 0, l = stockmarket.stocks.length; i < l; i++) {
            console.log(`Running Calculations for Stock: ${stockmarket.stocks[i].name}`);
            stocks = stockmarket.stocks[i];
            console.log(stocks);
            var stock = stockmarket.stocks[i];
            console.log(`Calculating Stock price for ${stock.name}`);
            newstockprice = await CalculateStockPrice(stock);
            console.log(`Final Stock Price: ${newstockprice}`);
            owners = stocks.owners;
            var companystock = {"name": stock.name, "price": Math.round(newstockprice), "owners": owners};
            console.log(`Stock for: ${stock}`);
            console.log(companystock);
            finalstocks.push(companystock); 
            console.log(`Final Stock Array`);
            console.log(finalstocks);
        }
        console.log(`Logging final stock array`);
        console.log(finalstocks);
        stockmarket.stockmarketactive = 0;
        stockmarket.stocks = finalstocks; 
        pglibrary.WriteToJson(stockmarket, './stockmarket.json');
        console.log(`Setting Up timer for reenable`);
        let stockTimeout = setTimeout(EnableStockMarket, 3600000 * stockmarket.updateinterval);
        console.log(stockTimeout);
        pglibrary.sleep(100);
        console.log(`End of StockMarket func`);
    }   
}

function GrabStockMarketData(){
    stockmarket = fs.readFileSync(`stockmarket.json`, 'utf-8');
    data = JSON.parse(stockmarket);
    return data;
}

function EnableStockMarket(){
    var stockmarket = GrabStockMarketData();
    if(stockmarket.stockmarketactive == 1){
        return;
    }
    console.log(`Stock Market ready to update`);
    stockmarket.stockmarketactive = 1;
    pglibrary.WriteToJson(stockmarket, './stockmarket.json');
}

async function CalculateStockPrice(stock) {
    var possibleIncrements= [0, 100, 200, 250, 500, 1000, 1250, 1500];
    incrementamountIndex = pglibrary.getRandomInt(possibleIncrements.length); // pick a random number ranging from 0 to the amount of entry's in our startingAmounts array
    console.log(`Increment Amount Index: ${incrementamountIndex}`);
    var chance = Math.random();
    console.log(`P/N Chance: ${chance}`);
    if (chance <= 0.5) {
        console.log(`Increment amount is positive`);
        incrementamount = possibleIncrements[incrementamountIndex];
    } else {
        console.log(`Increment amount is negative`);
        incrementamount = possibleIncrements[incrementamountIndex] * - 1;
    }
    console.log(`Increment Amount: ${incrementamount}`);
    
    stocksinService = GrabStocksinOwnership(stock);
    console.log(`Stocks in Service for stock ${stock.name}: ${stocksinService}`);
    if (stocksinService <= 0) {
        stocksinService = 1
    } 
    ownerfactor = Math.round(stocksinService * 0.65);
    if (ownerfactor >= 5) {
        ownerfactor = 5;
    }
    newstockprice = stock.price + incrementamount * ownerfactor * pglibrary.getRandomInt(2);
    console.log(`Final Stock Price: ${newstockprice}`);
    if (newstockprice >= 1000000) {
        console.log(`Stock hit is market cap`);
        newstockprice = 1000000;
    }
    if (newstockprice < 0) {
        await StockCrash(stock);
        return 2000;
    }
    console.log(newstockprice);
    return newstockprice;
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
            pglibrary.WriteToJson(stockmarket, './stockmarket.json');
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
    console.log(`Toggaling Heist Locations`);
    HeistLocationToggle();
    return;
}


async function HeistFiles(){
    let heists = [];
    heistsF = fs.readdirSync(`./heists`);
    console.log(heistsF);
    if(!heistsF){
        console.log(`Reading DIR Failed`);
        return;
    }
    for(i=0;i<heistsF.length;i++){
        file = heistsF[i];
        console.log(`File Found: ${file}`);
        if(file == 'heist.json'){
            continue;
        }
        if(file.startsWith('heist') && file.endsWith('.json')){
            console.log(file);
            console.log(`Found an onging heist file, pushing`);
            heists.push(file);
        }
    }
    console.log(`Final Found Files`);
    console.log(heists);
    return heists;
}

function HeistInvData(){
    heistinvdata = fs.readFileSync('./heists/usersinventory.json');
    heistinv = JSON.parse(heistinvdata);
    return heistinv;
}

function HeistLocationData(){
    heistlocdata = fs.readFileSync('./heists/locations.json');
    heistloc = JSON.parse(heistlocdata);
    return heistloc;
}

async function HeistLocationToggle(){
    locations = HeistLocationData();
    heists = await HeistFiles();
    console.log(locations);
    date = new Date();
    day = date.getDay();
    console.log(`Current Date: ${date}, Day: ${day}.`);
    for(i=0;i<locations.locations.length;i++){
        location = locations.locations[i];
        console.log(location);
        skip = 0;
        heists.forEach(heist => {
            console.log(`Checking Heist: ${heist}`);
            console.log(heist);
            heistDataRaw = fs.readFileSync(`./heists/${heist}`);
            heistData = JSON.parse(heistDataRaw);
            if(heistData.location.name == location.name){
                console.log(`${location.name} has a heist on going, skipping toggle`);
                skip = 1;
            }
        })   
        if(typeof location.madeunavailable === 'undefined'){
            console.log(`Location Date is empty, setting to current date`);
            locations.locations[i].madeunavailable = date;
            pglibrary.WriteToJson(locations, './heists/locations.json');
            continue;
        }
        locationDate = new Date(location.madeunavailable);
        locationDay = locationDate.getDay();
        console.log(`Location ${location.name}'s Date: ${locationDate}, Day: ${locationDay}`);
        if(day > locationDay && skip == 0){
            console.log(`Day is greater than the location date`);
            if(location.available == 0){
                pglibrary.ChannelLog(`Heist Location ${locations.locations[i].name} is now disabled.`, 'Automated Function', bot);
                console.log(`Location is disabled`);
                locations.locations[i].available = 1;
                locations.locations[i].madeunavailable = date;
            } else {
                pglibrary.ChannelLog(`Heist Location ${locations.locations[i].name} is now enabled.`, 'Automated Function', bot);
                console.log(`Location is available`);
                locations.locations[i].available = 0;
                locations.locations[i].madeunavailable = date;
            }
        }
    }
    pglibrary.WriteToJson(locations, './heists/locations.json');
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
} // https://docs.microsoft.com/en-us/sql/connect/node-js/step-3-proof-of-concept-connecting-to-sql-using-node-js?view=sql-server-ver15
