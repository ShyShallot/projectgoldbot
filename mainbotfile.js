const { Client, Intents, MessageEmbed } = require('discord.js'); // Setup our basic stuff
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] }); // If events are not triggering check intents list and add it to this one search it to find it
const config = require('./config.json'); // basic load of config file
const game = require('./game.json'); // Game Status
const welcome = require('./welcomemessages.json'); // Welcome Messages 
const fs = require('fs'); // File System for JS
const talkedRecently = new Set(); // unused for cooldown
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); // read our commands folder 

bot.commands = new Map(); // New Array for our commands
bot.on('ready', () => { // when the bot has logged in and is ready
    console.log('PG Bot Ready');
    console.log(`Current Game: ${game}`);
    bot.user.setActivity(game, {type: 'PLAYING'}); // Set our game status
    for (const file of commandFiles) { 
      const command = require(`./commands/${file}`);
      bot.commands.set(command.name, command); // add our commands to our array
    }
    Jackpot(0); // Init Raffle
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
    if (message.author.bot){
        return;
    }
    const args = message.content.slice(config.prefix.length).split(/ +/g); // basic argument by spliting a message by spaces
    const command = args.shift().toLowerCase(); 
    const eargs = message.content.slice(config.econprefix.length).split(/ +/g);
    const ecommand = eargs.shift().toLowerCase();
    let modRole = message.guild.roles.cache.find(r => r.name === "PG Member");
    console.log(command);
    console.log(ecommand);
    AutomatedMessage(message);
    if (message.content.startsWith(config.econprefix)) {
        if (ecommand === "coinflip"){
            bot.commands.get("coinflip").execute(message, args, bot);
        }
        if (ecommand === "raffle"){
            bot.commands.get("jackpot").execute(message, args, bot, 0);
        }
        if (ecommand === "forceraffle" && message.member.roles.cache.some(role => role.name === modRole)){
            Jackpot(1);
            message.channel.send(`Forcing Raffle Status`)
        }
    }
    if (!message.content.startsWith(config.prefix) || message.author.bot){ 
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

function AutomatedMessage(message) {
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function Jackpot(forced) { // Changed to a raffle but am too lazy to update names -- Dyl 8/28/2021 
    console.log(`Checking For Jackpot Status`);
    var jackpotData = UpdateJackpotData();
    console.log(jackpotData);
    var runLoop = 1;
    var [day, hour] = UpdateDate();
    console.log(day, hour);
    while (runLoop == 1) {
        [day, hour] = UpdateDate();
        console.log(`Day and Hour: ${day}, ${hour}`);
        if (forced == 1 || RaffleValid(jackpotData, day)) {
            if (jackpotData.raffleactive == 0){
                console.log(hour, day);
                console.log(`Raffle Not Active Might Start One`);
                if ((forced == 1) && jackpotData.raffleactive == 0 || hour == 12 && jackpotData.raffleactive == 0) {
                    console.log(`Starting Jackpot`);
                    bot.commands.get("jackpot").execute(null, null, bot, 1);
                    await sleep(20000);
                } else {
                    await sleep(20000);
                }
            } else {
                jackpotData = UpdateJackpotData();
                console.log(`Raffle Currently Active`);
                console.log(hour, day);
                if ((forced == 1) && jackpotData.raffleactive == 1 || hour >= 22 && jackpotData.raffleactive == 1) {
                    console.log('Stop Jackpot');
                    bot.commands.get("jackpot").execute(null, null, bot, 0);
                    await sleep(20000);
                } else {
                    await sleep(20000);
                }
            }
        } else {
            await sleep(20000);
        }
        jackpotData = UpdateJackpotData();
        if (forced == 1 ) {
            console.log(`Stopping Forced Raffle Run`);
            return;
        }
        await sleep(20000);
    }
}

function UpdateJackpotData(){
    jackpot = fs.readFileSync(`jackpot.json`, 'utf-8');
    data = JSON.parse(jackpot);
    return data;
}

function UpdateDate(){
    var date = new Date();
    var hour = date.getHours();
    var day = date.getDay();
    console.log("Updating Date to: " + date, day, hour);
    return [day, hour];
}

function RaffleValid(json, day) {
    if (!(json.lastraffleday == day)) {
        console.log(`Raffle is allowed to start. ${json.lastraffleday}, ${day}`);
        return true;
    } else {
        console.log(`Raffle is not allowed to start. ${json.lastraffleday}, ${day}`);
        return false;
    }
}