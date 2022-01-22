const Discord = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
module.exports = {
    // this shit is a mess
    name: 'setminbet',
    description: 'set the minimum bet',
    args: 'A number of any value',
    active: true,
    execute(message, args, bot){
        if (args[0]){
            if(!isNaN(args[0])){
                configdata = fs.readFileSync(`./config.json`, 'utf-8');
                data = JSON.parse(configdata);
                console.log(data);
                var minbet = args[0]
                console.log(minbet);
                console.log("Current Min Bet " + data.mincoinbet);
                console.log("Min Bet from message " + minbet);
                data.mincoinbet = minbet;
                pglibrary.WriteToJson(data, './config.json');
            } else {
                message.channel.send(`<@${message.author.id}>, ${args[0]} is not a valid number`);
            }
        } else {
            message.channel.send(`<@${message.author.id}>, Please provide a valid argument/number`);
        }
    }
}
