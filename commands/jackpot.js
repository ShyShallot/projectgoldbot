const {MessageEmbed} = require('discord.js');
const config = require('../config.json');
const jackpotid = '875821312998793247' // same as below but for a role
const rafflechannel = '844002249872113665'; // since this is used for one server we just define the channel we want to use by ID
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
// This was a jackpot command but was changed to a raffle, this file handles the starting, ending and current raffle functions
module.exports = {
    name: 'jackpot',
    description: 'Join the Public Raffle',
    args: 'No Arguments',
    active: false,
    econ:true,
   * execute(message, args, bot, jackpotState){
        if (!message && jackpotState == 1) { // hacky solution for starting the jackpot from our mainbotfile.js
            StartJackpot(bot);
        } else if(!message && jackpotState == 0) { // pretty much the same for starting it
            JackpotEnd(bot);
        } else { // if there is a message, this doesn't really care about jackpotState
            var userID = message.author.id; // Get the ID of the person who sent the message
            var jackpot = fs.readFileSync('./jackpot.json', 'utf-8'); // Read and write the contents of jackpot.JSON to a var
            var data = JSON.parse(jackpot); // parse the JSON file into a JS object array format
            if (data.raffleactive == 1 && !IsUserAlreadyInJackpot(userID)) { // if a raffle is active and the user sending the raffle command is not already in the raffle
                console.log(`User is not in Jackpot, running function`);
                MainJackpot(user, message); // Run Main Raffle Function of adding the user to the raffle
            } else if (data.raffleactive == 1 && IsUserAlreadyInJackpot(userID)) { // if a raffle is active and the user sending the command is already in the raffle
                message.channel.send(`<@${userID}>, you are already in the raffle.`);
            } else { // This can only be triggered if the conditions above are false
                message.channel.send(`<@${userID}>, there is no raffle active.`);
            }
        }
  }
}

function IsUserAlreadyInJackpot(userID){
    console.log(`Checking if ${userID} is in jackpot`);
    var jackpot = fs.readFileSync('./jackpot.json', 'utf-8'); // we already defined this var be pretty much update it here everytime this function is called
    var data = JSON.parse(jackpot); // parse the JSON into a JS format
    if (!(data.users.length == 0)) { // if the length of the Users object array in our original array is not empty
        for (var i = 0, l = data.users.length; i < l; i++) { // initially i is set to 0, then l is set to the amount of entry's in data.users, and if I is less than L add 1 to I.
            curUser = data.users[i].id; // get the ID for the current user 
            console.log(curUser);
            if (userID == curUser) { // if the userID we want to check is equal to the curUser in the arrray return true
                console.log(`User ${userID} is already in the jackpot`);
                return true;
            } else { // if we cant find the user in the array return false
                console.log(`User ${userID} is not already in the jackpot`);
                return false;
            }
        }
    } else {
        return false; // return false if the amount of entry's in the Users object array is empty
    }
}   

async function UpdateJsonFile(state, bet, user) { // this function is a bit of a mess 
    console.log(`Updating Json File`);
    var jackpot = fs.readFileSync('./jackpot.json', 'utf-8'); // update the jackpot var array
    var data = JSON.parse(jackpot); // parse it
    console.log(`Given Arguments: ${state}, ${user}`); // Log the given arguments that were handed to the function when called
    console.log(data); // log the data array
    if (bet != null) { // if bet is not equal to null, we do this when we add a user to the JSON file
        var bet = parseInt(bet); // make sure the bet is turned into a Integer so it can be read properly 
        console.log(`Given Arguments: ${state}, ${bet}, ${user}`); 
    } else {
        bet = 0 // if bet is equal to null set it to zero so it doesn't affect our JSON file
    }
    var jsonuA = data.users; // create a separate array that is a copy of data.users
    if (user != null ) { // if we gave a proper user
        userObject = { // create a user object array
            "username": user.username, // entry username is equal to the given user's username
            "id": user.id, // you get the idea
            "displayAvatarURL": user.displayAvatarURL(),
        };
        console.log(userObject);
        console.log(`Adding User: ${userObject.username} to Jackpot File`);
        jsonuA.push(userObject); // push our new userObject array to our copied array
        console.log(jsonuA);
    } 
    var rafflepotT = data.rafflepot; // set a variable that is equal to the pot of the raffle from our jackpot.json so we can then add onto it
    console.log(rafflepotT);
    var totalpot = rafflepotT + bet; // add the given bet to our raffle pot
    console.log(`Total Bet ${totalpot}`);
    var jsonupdate = {raffleactive: state, rafflepot: totalpot, lastraffleday: data.lastraffleday, users: jsonuA}; // recreate our JSON file here so we can then write to the file
    await pglibrary.WriteToJson(jsonupdate, './jackpot.json').then((status) => {console.log(status)});
}

function StartJackpot(bot) {
    var jackpot = fs.readFileSync('./jackpot.json', 'utf-8'); // update our reading of jackpot.json
    var data = JSON.parse(jackpot);
    if (data.raffleactive == 0) { // if a raffle is not active
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
        const embed = new MessageEmbed() // create a new embed var
            .setTitle("Raffle")
            .setAuthor(`${bot.user.username}`, bot.user.displayAvatarURL())
            .setColor("#2bff00")
            .setDescription(`<@&${jackpotid}>, a Raffle has been started, Raffle Pot is: ${Math.round(startingamount * startingMultiplier)} points.`)
        bot.channels.cache.get(rafflechannel).send({ content: `<@&${jackpotid}>`, embeds: [embed] }); // grab the channel with the ID defined above from the bots cache and send a message containing a mention and our embed
        UpdateJsonFile(1, startingamount * startingMultiplier, null); // update our json file to include the new information given of the raffle now being active, and our starting amount times our mutliplier with a null user
    }
}

function MainJackpot(user, message) {
    var jackpot = fs.readFileSync('./jackpot.json', 'utf-8'); // read our jackpot.json
    var data = JSON.parse(jackpot); // parse into a JS format
    if (data.raffleactive == 1 && !IsUserAlreadyInJackpot(message.author.id)) { // check again just to be sure
        console.log(`User ${user.username} has entered the Raffle`);
        message.channel.send(`<@${message.author.id}>, you have entered the raffle.`); // send a message to the channel from where the command was sent telling the user they are in the raffle
        UpdateJsonFile(1, null, message.author); // update the json file, the only time the 1 should be zero is if the raffle is ending
    } else {
        message.channel.send(`<@${message.author.id}>, No Raffle is currently running.`); // tell the user no raffle is running 
    }
}


async function JackpotEnd(bot){
    var serverID = '631008739830267915'; // define our server ID
    var jackpot = fs.readFileSync(`./jackpot.json`, 'utf-8'); // read from the JSON file
    var data = JSON.parse(jackpot);
    console.log(data);
    console.log(`User Table Length ${data.users.length}`); // log the amount of entry's in users array
    if (data.users.length >= 5) { // if it is over 5, this value sets the minimum amount of people needed for the raffle to properly end, you could set this in the json file and have a command to change it
        var randomPick = pglibrary.getRandomInt(data.users.length); // get a random whole number ranging from 0 to the amount of entry's in the users array
        console.log(`Pick: ${randomPick}`);
        var winner = data.users[randomPick]; // grab the winner from array using the index from our randomPick var
        console.log(`Winner ID: ${winner}`);
        var gain = data.rafflepot; // define the var gain as the rafflepot in jackpot.JSON
        console.log(`Gain ${gain}`);
            points_manager.giveUserPoints(winner.id, gain, 'cash');
            const embed = new MessageEmbed()
                .setTitle("Raffle")
                .setAuthor(`${winner.username}`, winner.displayAvatarURL())
                .setColor("#2bff00")
                .setDescription(`<@&${jackpotid}>, <@${winner.id}> has won the raffle and has gained ${gain} points!`)
            bot.channels.cache.get(rafflechannel).send({ content: `<@&${jackpotid}>`, embeds: [embed] }); 
            console.log("Resetting Jackpot.JSON");
        await ResetRaffleJson(data); // reset our jackpot.JSON for the next raffle to start
    } else { // if not enough people entered the raffle end it with no winner
        const embed = new MessageEmbed()
                .setTitle("Raffle")
                .setAuthor(`${bot.user.username}`, bot.user.displayAvatarURL())
                .setColor("#2bff00")
                .setDescription(`<@&${jackpotid}>, Not enough people entered the Raffle in time, ending today's raffle.`)
                bot.channels.cache.get(rafflechannel).send({ content: `<@&${jackpotid}>`, embeds: [embed] });
                console.log("Resetting Jackpot.JSON");
        await ResetRaffleJson(data);
    }
}




function SetLastRaffleDay(data) {
    var date = new Date();
    var day = date.getDay(); // date.getDay() can only return 0-6, 0 being sunday, and 6 being saturday.
    var lastday = data.lastraffleday; // Get the last day from our JSON file
    console.log(lastday);
    var currentday = lastday + 1; // the current day is equal to the last day plus 1, we could use the day we defined but its safer to use this
    console.log(currentday);
    if (currentday == 7) { 
        console.log(currentday);
        currentday = 0; // if the current day is 7 which is not a day, then it will set it to the proper 0
    }
    if (lastday == day) { // this only gets used when the raffle is forced
        currentday = day;
    }
    return currentday;
}