const { Client, Intents, MessageEmbed, MessageAttachment } = require('discord.js'); // Setup our basic stuff
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] }); // If events are not triggering check intents list and add it to this one search it to find it
const config = require('./config.json'); // basic load of config file
const game = require('./game.json'); // Game Status
const welcome = require('./welcomemessages.json'); // Welcome Messages 
const fs = require('fs'); // File System for JS
const talkedRecently = new Set(); // unused for cooldown
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); // read our commands folder 
const pglibrary = require("./libraryfunctions.js");
const stock = require('./commands/stock');

bot.commands = new Map(); // New Array for our commands
bot.on('ready', () => { // when the bot has logged in and is ready
    console.log('PG Bot Ready');
    console.log(`Current Game: ${game}`);
    bot.user.setActivity(game, {type: 'PLAYING'}); // Set our game status
    for (const file of commandFiles) { 
      const command = require(`./commands/${file}`);
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
    let modRole = message.guild.roles.cache.find(r => r.name === "PG Member"); // check for a mod role, set this to the name of your servers admin role
    console.log(command);
    console.log(ecommand);
    AutomatedMessage(message);
    if (message.content.startsWith(config.econprefix)) { // this is to extend UnbelievaBoat's functionality
        if (ecommand === "coinflip"){
            bot.commands.get("coinflip").execute(message, args, bot);
        }
        if (ecommand === "raffle"){
            bot.commands.get("jackpot").execute(message, args, bot, 0);
        }
        if (ecommand === "forceraffle" && message.member.roles.cache.some(role => role.name === modRole)){ // mod only command
            Jackpot(1);
            message.channel.send(`Forcing Raffle Status`)
        }
        if (ecommand === "stocks") {
            bot.commands.get("stocks").execute(message, args, bot)
        }
    }
    if (!message.content.startsWith(config.prefix) || message.author.bot){ // if the message doesn't start with our prefix don't bother
        return;
    }

    // Base for adding commands: if(command === "name"){
    //  bot.commands.get("name").execute(message, args, bot)
    //}

    //if (command === "stafflist") {
    //    bot.commands.get("stafflist").execute(message, args, bot);
    //}
    if (command === "toggleauto"){
        bot.commands.get("automsgT").execute(message, args, bot);
    }
    if (command === "setgame"){
        bot.commands.get("setgame").execute(message, args, bot);
    }
    if (command === "setminbet"){
        bot.commands.get("setminbet").execute(message, args, bot);
    }
});
bot.login(config.token);

function AutomatedMessage(message) { // this is to keep annoying as people from asking annoying questions you can remove this or use it as a base for automoding 
    let modRole = message.guild.roles.cache.find(r => r.name === "PG Member");
    const automessge = require(`./automatedmessagestatus.json`);
    if (automessge.state == "1"){
        if (!message.member.roles.has(modRole.id)){
            const args = message.content.split(/ +/g);
            console.log(args.includes('beta'));
            if (args.includes('beta') && args.includes('release') && args.includes('when')){
                message.channel.send(`<@${message.author.id}>, please note that either you cant read or are blind, there are plenty of resources saying that the mod is currently not released. With a currently unplanned release date.`)
            }
        }
    }
}

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

function UpdateJackpotData(){ // update the jackpot data array
    jackpot = fs.readFileSync(`jackpot.json`, 'utf-8');
    data = JSON.parse(jackpot);
    return data;
}

function GrabStockMarketData(){
    stockmarket = fs.readFileSync(`stockmarket.json`, 'utf-8');
    data = JSON.parse(stockmarket);
    return data;
}

function UpdateDate(){ // update the date
    var date = new Date();
    var hour = date.getHours();
    var day = date.getDay();
    console.log("Updating Date to: " + date, day, hour);
    return [day, hour];
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

async function StockMarket() {
    console.log("Starting Stock Market");
    var stockmarket = GrabStockMarketData();
    console.log(stockmarket);
    date = new Date();
    day = date.getDay();
    if (stockmarket.stockmarketactive == 1 && stockmarket.lastupdatedday != day) {
        var finalstocks = [];
        for (var i = 0, l = stockmarket.stocks.length; i < l; i++) {
            console.log(`Running Calculations for Stock: ${stockmarket.stocks[i].name}`);
            stocks = stockmarket.stocks[i];
            console.log(stocks);
            var stock = stockmarket.stocks[i];
            console.log(`Calculating Stock price for ${stock.name}`);
            newstockprice = CalculateStockPrice(stock);
            console.log(`Final Stock Price: ${Math.round(newstockprice)}`);
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
        lastday = UpdateLastDay(stockmarket.lastupdatedday);
        finaljsonfile = {"stocks": finalstocks, "stockmarketactive": stockmarket.stockmarketactive, "maxownedstocks": stockmarket.maxownedstocks, "lastupdatedday": lastday}
        pglibrary.WriteToJson(finaljsonfile, './stockmarket.json');
    }
}

function CalculateStockPrice(stock) {
    var possibleIncrements= [0, 100, 200, 250, 500, 1000, 1250, 1500];
    incrementamountIndex = pglibrary.getRandomInt(possibleIncrements.length); // pick a random number ranging from 0 to the amount of entry's in our startingAmounts array
    console.log(incrementamountIndex);
    var chance = Math.random();
    console.log(chance);
    if (chance <= 0.5) {
        console.log(`Increment amount is positive`);
        incrementamount = possibleIncrements[incrementamountIndex];
    } else {
        console.log(`Increment amount is negative`);
        incrementamount = possibleIncrements[incrementamountIndex] * - 1;
    }
    console.log(incrementamount);
    
    stocksinService = GrabStocksinOwnership(stock);
    console.log(`Stocks in Service for stock ${stock.name}: ${stocksinService}`);
    if (stocksinService <= 0) {
        stocksinService = 1
    }
    ownerfactor = Math.round(stocksinService * 0.65)
    newstockprice = stock.price + incrementamount * ownerfactor * pglibrary.getRandomInt(3);
    console.log(`Final Stock Price: ${newstockprice}`);
    if (newstockprice >= 1000000 / ownerfactor) {
        console.log(`Stock hit is market cap`);
        newstockprice = 1000000 / ownerfactor;
    }
    return newstockprice;
}

function UpdateLastDay(day) {
    day += day++;
    if (day == 7) { 
        console.log(currentday);
        day = 0; // if the current day is 7 which is not a day, then it will set it to the proper 0
    }
    return day;
}

function GrabStocksinOwnership(stock) { // Modified Max User Stocks function
    var stockmarket = GrabStockMarketData();
    ownedStocks = 0;
    console.log(ownedStocks)
    stock.owners.forEach(owner => {
        console.log(owner);
        ownerAmount = owner.amount;
        console.log(ownerAmount);
        ownedStocks += ownedStocks.ownerAmount;
        console.log(ownedStocks);
    });
    console.log(ownedStocks);
    return ownedStocks;
}

async function Economy(){ // Janky as fuck but works
    while (true) {
        await Jackpot(0); // Init Raffle
        await StockMarket();
        await pglibrary.sleep(5000);
    }
}
