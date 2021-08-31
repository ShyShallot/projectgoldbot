const {MessageEmbed} = require('discord.js');
const config = require('../config.json');
const { Client } = require('unb-api');
const client = new Client(config.econtoken);
const jackpotid = '875821312998793247'
const rafflechannel = '844002249872113665';
const fs = require('fs');
module.exports = {
    name: 'jackpot',
    description: 'flip a coin',
    execute(message, args, bot, jackpotState){
        if (!message && jackpotState == 1) {
            StartJackpot(bot);
        } else if(!message && jackpotState == 0) { 
            JackpotEnd(bot);
        } else {
            var userID = message.author.id;
            var serverID = message.guild.id;
            client.getUserBalance(serverID, userID).then(user => {
                var date = new Date();
                var day = date.getDay();
                var hour = date.getHours();
                console.log(day)
                var jackpot = fs.readFileSync('./jackpot.json', 'utf-8');
                var data = JSON.parse(jackpot);
                if (data.raffleactive == 1 && !IsUserAlredyInJackpot(userID)) {
                    console.log(`Jackpot User table is empty`);
                    MainJackpot(user, message);
                } else if (data.raffleactive == 1 && IsUserAlredyInJackpot(userID)) {
                    message.channel.send(`<@${userID}>, you are already in the raffle.`);
                } else {
                    message.channel.send(`<@${userID}>, there is no raffle active.`);
                }
            });
        }
  }
}

function IsUserAlredyInJackpot(userID){
    console.log(`Checking if ${userID} is in jackpot`);
    var jackpot = fs.readFileSync('./jackpot.json', 'utf-8');
    var data = JSON.parse(jackpot);
    if (!(data.users.length == 0)) {
        for (var i = 0, l = data.users.length; i < l; i++) {
            curUser = data.users[i].id;
            console.log(curUser)
            if (userID == curUser) {
                console.log(`User ${userID} is already in the jackpot`);
                return true;
            } else {
                console.log(`User ${userID} is not already in the jackpot`);
                return false;
            }
        }
    } else {
        return false;
    }
}   

function UpdateJsonFile(state, bet, user) {
    console.log(`Updating Json File`);
    var jackpot = fs.readFileSync('./jackpot.json', 'utf-8');
    var data = JSON.parse(jackpot);
    console.log(`Given Arguments: ${state}, ${user}`); 
    console.log(data);
    if (bet != null) {
        var bet = parseInt(bet);
        console.log(`Given Arguments: ${state}, ${bet}, ${user}`); 
    } else {
        bet = 0
    }
    var jsonuA = data.users;
    if (user != null ) {
        userObject = {
            "username": user.username,
            "id": user.id,
            "displayAvatarURL": user.displayAvatarURL(),
        };
        console.log(userObject);
        console.log(`Adding User: ${userObject.username} to Jackpot File`);
        jsonuA.push(userObject);
        console.log(jsonuA);
    } 
    var jackbotBet = data.rafflepot;
    console.log(jackbotBet);
    var totalbet = jackbotBet + bet;
    console.log(`Total Bet ${totalbet}`);
    var jsonupdate = {raffleactive: state, rafflepot: totalbet, lastraffleday: data.lastraffleday, users: jsonuA};
    var JSONIFY = JSON.stringify(jsonupdate);
    console.log(JSONIFY)
    WritetoJson(JSONIFY)
}

function StartJackpot(bot) {
    var jackpot = fs.readFileSync('./jackpot.json', 'utf-8');
    var data = JSON.parse(jackpot);
    if (data.raffleactive == 0) {
        var startingAmounts = [500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000];
        var startingamountIndex = getRandomInt(startingAmounts.length);
        var startingamount = startingAmounts[startingamountIndex];
        console.log(startingamount);
        var startingamountMultipliers = [0.95, 1, 1.15, 1.2, 1.35, 1.5, 1.65, 1.75, 2];
        var startingamountMultipliersIndex = getRandomInt(startingamountMultipliers.length);
        var startingMultiplier = startingamountMultipliers[startingamountMultipliersIndex];
        var bigmulti = Math.random();
        console.log(bigmulti);
        if (bigmulti >= 0.98) {
            console.log(`Big Multiplier`);
            var startingMultiplier = 5;
        }
        console.log(startingMultiplier);
        const embed = new MessageEmbed()
        .setTitle("Raffle")
        .setAuthor(`${bot.user.username}`, bot.user.displayAvatarURL)
        .setColor("#2bff00")
        .setDescription(`<@&${jackpotid}>, a Raffle has been started, Raffle Pot is: ${Math.round(startingamount * startingMultiplier)} points.`)
        bot.channels.cache.get(rafflechannel).send({ content: `<@&${jackpotid}>`, embeds: [embed] });
        UpdateJsonFile(1, startingamount * startingMultiplier, null);
    }
}

function MainJackpot(user, message) {
    var jackpot = fs.readFileSync('./jackpot.json', 'utf-8');
    var data = JSON.parse(jackpot);
    if (data.raffleactive == 1 && !IsUserAlredyInJackpot(message.author.id)) {
        console.log(`User ${user.username} has entered the Raffle`);
        message.channel.send(`<@${message.author.id}>, you have entered the raffle.`);
        UpdateJsonFile(1, null, message.author);
    } else {
        message.channel.send(`<@${message.author.id}>, No Raffle is currently running.`);
    }
}

function WritetoJson(content) {
    fs.writeFile("./jackpot.json", content, function(err){
        if(err){
          return console.log(err);
        }
        console.log("The File was saved");
    });
}

function JackpotEnd(bot){
    var serverID = '631008739830267915';
    var jackpot = fs.readFileSync(`./jackpot.json`, 'utf-8');
    var data = JSON.parse(jackpot);
    console.log(data);
    console.log(`User Table Length ${data.users.length}`);
    if (data.users.length >= 1) {
        var randomPick = getRandomInt(data.users.length);
        console.log(`Pick: ${randomPick}`);
        var winner = data.users[randomPick];
        console.log(`Winner ID: ${winner}`);
        client.getUserBalance(serverID, winner.id).then(user => {
            var gain = data.rafflepot;
            console.log(`Gain ${gain}`);
            client.editUserBalance(serverID, winner.id, { cash: gain, bank: 0}).then(user => {
                const embed = new MessageEmbed()
                .setTitle("Raffle")
                .setAuthor(`${winner.username}`, winner.displayAvatarURL)
                .setColor("#2bff00")
                .setDescription(`<@&${jackpotid}>, <@${winner.id}> has won the raffle and has gained ${gain} points!`)
                bot.channels.cache.get(rafflechannel).send({ content: `<@&${jackpotid}>`, embeds: [embed] });
                console.log("Resetting Jackpot.JSON")
                ResetRaffleJson(data);
            });
        });
    } else {
        const embed = new MessageEmbed()
                .setTitle("Raffle")
                .setAuthor(`${bot.user.username}`, bot.user.displayAvatarURL)
                .setColor("#2bff00")
                .setDescription(`<@&${jackpotid}>, Not enough people entered the Raffle in time, ending today's raffle.`)
                bot.channels.cache.get(rafflechannel).send({ content: `<@&${jackpotid}>`, embeds: [embed] });
                console.log("Resetting Jackpot.JSON")
                ResetRaffleJson(data);
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function ResetRaffleJson(data) {
    var jsonupdate = {raffleactive: 0, rafflepot: 0, lastraffleday: SetLastRaffleDay(data), users: []};
    var JSONIFY = JSON.stringify(jsonupdate);
    console.log(JSONIFY)
    fs.writeFile("./jackpot.json", JSON.stringify(jsonupdate), 'utf8', function(err){
        if(err){
          return console.log(err);
        }
        console.log("The File was saved");
    });
}

function SetLastRaffleDay(data) {
    var date = new Date();
    var day = date.getDay();
    var lastday = data.lastraffleday;
    console.log(lastday);
    var currentday = lastday + 1;
    console.log(currentday);
    if (currentday == 7) {
        console.log(currentday);
        currentday = 0; // if the current day is 7 which is not a day, then it will set it to the proper 0
    }
    if (lastday == day) {
        currentday = day;
    }
    return currentday;
}