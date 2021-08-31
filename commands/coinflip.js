const {MessageEmbed} = require('discord.js');
const config = require('../config.json');
const { Client } = require('unb-api');
const client = new Client(config.econtoken);
// this file handles the coinflip command
module.exports = {
    name: 'coinflip',
    description: 'flip a coin',
    execute(message, args, bot){
        var userID = message.author.id; // grab the user id from the message containing the command
        var serverID = message.guild.id; // grab the server id from the message sent
        client.getUserBalance(serverID, userID).then(user => { // grab the user balance using Unbeliavble boats API
            console.log(user.cash);
            console.log(args[0]); // grab the arguments from the command
            if (args[0] == "heads" || args[0] == "tails"){ // only accept heads or tails as the first argument 
                console.log(args[1])
                if (args[1]){ // if the second argument exists, this args is supposed to be the bet amount
                    console.log("Valid Number");
                    if(!isNaN(args[1])){ // this checks if the 2nd arg given is a number
                        console.log("Number is a infact number");
                        FlipCoin(user, args, serverID, userID, message); // run the FlipCoin function with the given args
                    } else if (args[1] == `all`) { // if the 2nd arg given is not a number but contains all
                        console.log(`User is betting all of their cash.`);
                        args[1] = user.cash; // set the 2nd arg to all the users cash in hand
                        console.log(args[1])
                        FlipCoin(user, args, serverID, userID, message);
                    } else if (args[1] == `half`) { // same as all but does only half their cash
                        console.log(`User is betting half of their cash.`);
                        args[1] = Math.round(user.cash / 2); // round their cash in hand divided by 2
                        console.log(args[1])
                        FlipCoin(user, args, serverID, userID, message);
                    } else { // if the 2nd given argument is not one were expecting, tell the user
                        message.channel.send(`<@${message.author.id}>, ${args[1]} is not a valid argument, valid args is a number, all or half`); 
                    }
                }
            } else { // if no argument is given and only the command is sent tell the user
                message.channel.send(`<@${message.author.id}>, no args have been given, to use coinflip do ${config.econprefix}coinflip [heads/tails] [bet/all/half].`);
            }
        });
  }
}
function IncomeGain(user, land, args, serverID, userID, message) {
    var multi = CalculateMultiplier(args[1]); // calculate a multiplier from the users bet
    console.log(`Bet Multiplier: ${multi}`);
    var gain = Math.round(args[1] * multi); // round their bet times the calculated mutliplier 
    var gaininPlace = commafy(gain); // create string var of their gained points with every three digits being seperated by a ,
    client.editUserBalance(serverID, userID, { cash: gain, bank: 0}).then(user => { // edit their point balance by giving their gained amount of points using the unbeliavbleboats API
        const embed = new MessageEmbed()
        .setTitle("Coin Flip")
        .setAuthor(`${message.author.username}`, message.author.displayAvatarURL)
        .setColor("#2bff00")
        .setDescription(`<@${message.author.id}>, The Coin Landed on ${land}, and you have gained: ${gaininPlace} points.`)
        message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
    });
}

function IncomeLoss(user, land, pick, args, serverID, userID, message) { // this function is used to tell the user that they lost, we don't subtract from the balance here as we already do that when the user goes to flip a coin, so this is just a message sent telling the user they lost
    var loss = commafy(args[1]); // turn their bet into a string with every three digits being seperated by a ,
    console.log(loss);
    const embed = new MessageEmbed()
    .setTitle("Coin Flip")
    .setAuthor(`${message.author.username}`, message.author.displayAvatarURL)
    .setColor("#ff031c")
    .setDescription(`<@${message.author.id}>, the coin landed on ${land}, but you picked: ${pick}. You have lost: ${loss} points.`)
    message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
}

function CalculateMultiplier(bet) {
    if (bet < 10000) { // make it so any bet under 10k only gets a 2 times multiplier 
        var multiplier = 2;
        return multiplier;
    }
    var multiplier = 2;
    console.log(multiplier);
    var digits = numDigits(bet) / 10; // Gets the amount of digits in the bet and turns it into decimal place to then add to the base multiplier of 2
    console.log(multiplier + digits);
    return multiplier + digits;
}

function FlipCoin(user, args, serverID, userID, message) {
    if (args[1] <= user.cash) { // check if the user has enough cash to place a bet
        console.log("User has enough money in cash");
        var parsedMinBet = parseInt(config.mincoinbet); // turn the minimum bet found in config.json 
        if (args[1] >= parsedMinBet){ // if the given bet is over the minimum required bet
            console.log("Bet is over min");
            client.editUserBalance(serverID, userID, { cash: -args[1], bank: 0 }); // subtract from the users balance the amount they are betting
            var landing = Math.random() * 1.15; // the landing of the coin * 1.15, this makes it so it doesn't constantly land on 1 side to many times
            console.log(landing);
            if (landing <= 0.5 && args[0] == "heads"){ // if the landing is less than or equal to 0.5 and the user chose heads
                console.log("Landed on heads and won");
                var land = "heads";
                IncomeGain(user, land, args, serverID, userID, message); // give them their points as they won
            } else if (landing >= 0.5 && args[0] == "tails"){ // case for a win on tails
                console.log("Landed on tails and won");
                var land = "tails";
                IncomeGain(user, land, args, serverID, userID, message);
            } else if (landing >= 0.5 && args[0] == "heads"){ // loss for picking heads and landing on tails
                console.log("Landed on heads and lose");
                land = "tails";
                pick = "heads";
                IncomeLoss(user, land, pick, args, serverID, userID, message);
            } else if (landing <= 0.5 && args[0] == "tails") { // loss for picking heads and landing on tails
                console.log("Landed on tails and lost");
                pick = "tails";
                land = "heads";
                IncomeLoss(user, land, pick, args, serverID, userID, message);
            }
        } else {
            message.channel.send(`<@${message.author.id}>, The bet given is below the minimum bet of: ` + config.mincoinbet); // tell the user their bet is below minimum
        }
    } else {
        message.channel.send(`<@${message.author.id}>, you do not have enough cash in hand to do that.`); // tell the user their fucking broke
    }
}

function commafy( num ) { // taken from https://stackoverflow.com/a/6786040
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