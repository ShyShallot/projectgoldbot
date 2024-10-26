const {MessageEmbed} = require('discord.js');
const config = require('../config.json');
const masterdb = require('../master-db/masterdb');
const points_manager = require('../points/manager');
const randomNum = require('../mersenne-twister');
const M = new randomNum.MersenneTwister();
// this file handles the coinflip command
module.exports = {
    name: 'coinflip',
    nicks: ["cf"],
    description: 'flip a coin',
    args: 'Heads/Tails | Bet Amount',
    active: true,
    econ: true,
    async execute(message, args, bot){
        guildId = message.guild.id;
        guildConfig = await masterdb.getGuildConfig(guildId);
        [cash,bank] = await points_manager.getUserBalance(message.author.id,guildId);
        console.log(cash, bank);
        console.log(args[0]); // grab the arguments from the command
        if (args[0] == "heads" || args[0] == "tails"){ // only accept heads or tails as the first argument 
            console.log(args[1])
            if (args[1]){ // if the second argument exists, this args is supposed to be the bet amount
                console.log("Valid Number");
                if(!isNaN(args[1])){ // this checks if the 2nd arg given is a number
                    console.log("Number is a infact number");
                    FlipCoin(cash,args, message); // run the FlipCoin function with the given args
                } else if (args[1] == `all`) { // if the 2nd arg given is not a number but contains all
                    console.log(`User is betting all of their cash.`);
                    args[1] = cash; // set the 2nd arg to all the users cash in hand
                    console.log(args[1])
                    FlipCoin(cash,args, message);
                } else if (args[1] == `half`) { // same as all but does only half their cash
                    console.log(`User is betting half of their cash.`);
                    args[1] = Math.round(cash / 2); // round their cash in hand divided by 2
                    console.log(args[1])
                    FlipCoin(cash,args, message);
                } else { // if the 2nd given argument is not one were expecting, tell the user
                    message.channel.send(`<@${message.author.id}>, ${args[1]} is not a valid argument, valid args is a number, all or half`); 
                }
            }
        } else { // if no argument is given and only the command is sent tell the user
            message.channel.send(`<@${message.author.id}>, no args have been given, to use coinflip do ${guildConfig.econprefix}coinflip [heads/tails] [bet/all/half].`);
        }
  }
}
function IncomeGain(land, args, message,guildId) {
    var multi = CalculateMultiplier(args[1]); // calculate a multiplier from the users bet
    console.log(`Bet Multiplier: ${multi}`);
    var gain = Math.round(args[1] * multi); // round their bet times the calculated mutliplier 
    var gaininPlace = commafy(gain); // create string var of their gained points with every three digits being seperated by a ,
    points_manager.giveUserPoints(message.author.id, gain, 'cash',true,guildId);
    const embed = new MessageEmbed()
    .setTitle("Coin Flip")
    .setAuthor(`${message.author.username}`, message.author.displayAvatarURL())
    .setColor("#2bff00")
    .setDescription(`<@${message.author.id}>, The Coin Landed on ${land}, and you have gained: ${gaininPlace} points.`)
    message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
}

function IncomeLoss(land, pick, args, message) { // this function is used to tell the user that they lost, we don't subtract from the balance here as we already do that when the user goes to flip a coin, so this is just a message sent telling the user they lost
    var loss = commafy(args[1]); // turn their bet into a string with every three digits being seperated by a ,
    console.log(loss);
    const embed = new MessageEmbed()
    .setTitle("Coin Flip")
    .setAuthor(`${message.author.username}`, message.author.displayAvatarURL())
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

async function FlipCoin(cash, args, message) {
    guildId = message.guild.id;
    guildConfig = await masterdb.getGuildConfig(guildId)
    if (args[1] <= cash) { // check if the user has enough cash to place a bet
        console.log("User has enough money in cash");
        var parsedMinBet = parseInt(guildConfig.mincoinbet); // turn the minimum bet found in config.json 
        if (args[1] >= parsedMinBet){ // if the given bet is over the minimum required bet
            console.log("Bet is over min");
            console.log(cash);
            points_manager.giveUserPoints(message.author.id, -args[1], "cash", true,guildId);
            var landing = M.random();
            console.log(landing);
            if (landing <= 0.5 && args[0] == "heads"){ // if the landing is less than or equal to 0.5 and the user chose heads
                console.log("Landed on heads and won");
                var land = "heads";
                IncomeGain(land, args, message,guildId); // give them their points as they won
            } else if (landing >= 0.5 && args[0] == "tails"){ // case for a win on tails
                console.log("Landed on tails and won");
                var land = "tails";
                IncomeGain(land, args, message,guildId);
            } else if (landing >= 0.5 && args[0] == "heads"){ // loss for picking heads and landing on tails
                console.log("Landed on heads and lose");
                land = "tails";
                pick = "heads";
                IncomeLoss(land, pick, args, message);
            } else if (landing <= 0.5 && args[0] == "tails") { // loss for picking heads and landing on tails
                console.log("Landed on tails and lost");
                pick = "tails";
                land = "heads";
                IncomeLoss(land, pick, args, message);
            }
        } else {
            message.channel.send(`<@${message.author.id}>, The bet given is below the minimum bet of: ` + guildConfig.mincoinbet); // tell the user their bet is below minimum
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