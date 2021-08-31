const {MessageEmbed} = require('discord.js');
const config = require('../config.json');
const { Client } = require('unb-api');
const client = new Client(config.econtoken);
module.exports = {
    name: 'coinflip',
    description: 'flip a coin',
    execute(message, args, bot){
        var userID = message.author.id;
        var serverID = message.guild.id;
        client.getUserBalance(serverID, userID).then(user => {
            console.log(user.cash);
            console.log(args[0]);
            if (args[0] == "heads" || args[0] == "tails"){
                console.log(args[1])
                if (args[1]){
                    console.log("Valid Number");
                    if(!isNaN(args[1])){
                        console.log("Number is a infact number");
                        FlipCoin(user, args, serverID, userID, message);
                    } else if (args[1] == `all`) {
                        console.log(`User is betting all of their cash.`);
                        args[1] = user.cash;
                        console.log(args[1])
                        FlipCoin(user, args, serverID, userID, message);
                    } else if (args[1] == `half`) {
                        console.log(`User is betting half of their cash.`);
                        args[1] = Math.round(user.cash / 2);
                        console.log(args[1])
                        FlipCoin(user, args, serverID, userID, message);
                    } else {
                        message.channel.send(`<@${message.author.id}>, ${args[1]} is not a valid number`);
                    }
                }
            } else {
                message.channel.send(`<@${message.author.id}>, that is not a valid argument, to use coinflip do ${config.econprefix}coinflip [heads/tails] [bet/all/half].`);
            }
        });
  }
}
function IncomeGain(user, land, args, serverID, userID, message) {
    var multi = CalculateMultiplier(args[1]);
    console.log(`Bet Multiplier: ${multi}`);
    var gain = Math.round(args[1] * multi);
    var gaininPlace = commafy(gain);
    client.editUserBalance(serverID, userID, { cash: gain, bank: 0}).then(user => {
        const embed = new MessageEmbed()
        .setTitle("Coin Flip")
        .setAuthor(`${message.author.username}`, message.author.displayAvatarURL)
        .setColor("#2bff00")
        .setDescription(`<@${message.author.id}>, The Coin Landed on ${land}, and you have gained: ${gaininPlace} points.`)
        message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
    });
}

function IncomeLoss(user, land, pick, args, serverID, userID, message) {
    var loss = commafy(args[1]);
    console.log(loss);
    const embed = new MessageEmbed()
    .setTitle("Coin Flip")
    .setAuthor(`${message.author.username}`, message.author.displayAvatarURL)
    .setColor("#ff031c")
    .setDescription(`<@${message.author.id}>, the coin landed on ${land}, but you picked: ${pick}. You have lost: ${loss} points.`)
    message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
}

function CalculateMultiplier(bet) {
    if (bet < 10000) { // make it so any bet under 10k only gets 2x
        var multiplier = 2;
        return multiplier;
    }
    var multiplier = 2;
    console.log(multiplier);
    var digits = numDigits(bet) / 10; // Gets the amount of digits in the bet and turns it into deciaml place to then add to the base multiplier of 2
    console.log(multiplier + digits);
    return multiplier + digits;
}

function FlipCoin(user, args, serverID, userID, message) {
    if (args[1] <= user.cash) {
        console.log("User has enough money in cash");
        var parsedMinBet = parseInt(config.mincoinbet)
        if (args[1] >= parsedMinBet){
            console.log("Bet is over min");
            client.editUserBalance(serverID, userID, { cash: -args[1], bank: 0 });
            var landing = Math.random() * 1.2;
            console.log(landing);
            if (landing <= 0.5 && args[0] == "heads"){
                console.log("Landed on heads and won");
                var land = "heads";
                IncomeGain(user, land, args, serverID, userID, message);
            } else if (landing >= 0.5 && args[0] == "tails"){
                console.log("Landed on tails and won");
                var land = "tails";
                IncomeGain(user, land, args, serverID, userID, message);
            } else if (landing >= 0.5 && args[0] == "heads"){
                console.log("Landed on heads and lose");
                land = "tails";
                pick = "heads";
                IncomeLoss(user, land, pick, args, serverID, userID, message);
            } else if (landing <= 0.5 && args[0] == "tails") {
                console.log("Landed on tails and lost");
                pick = "tails";
                land = "heads";
                IncomeLoss(user, land, pick, args, serverID, userID, message);
            }
        } else {
            message.channel.send(`<@${message.author.id}>, The bet given is below the minimum bet of: ` + config.mincoinbet);
        }
    } else {
        message.channel.send(`<@${message.author.id}>, you do not have enough cash in hand to do that.`);
    }
}

function commafy( num ) {
    var str = num.toString().split('.');
    if (str[0].length >= 5) {
        str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    }
    if (str[1] && str[1].length >= 5) {
        str[1] = str[1].replace(/(\d{3})/g, '$1 ');
    }
    return str.join('.');
}

function numDigits(x) { // taken from https://stackoverflow.com/a/28203456 god bless
    return (Math.log10((x ^ (x >> 31)) - (x >> 31)) | 0) + 1; 
  }