const Discord = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
module.exports = {
    name: 'setminbet',
    description: 'set the minimum bet',
    execute(message, args, bot){
        let modRole = message.guild.roles.cache.find(r => r.name === "PG Member");
        if (message.member.roles.cache.find(r => r.id === modRole.id)){
            if (args[0]){
                if(!isNaN(args[0])){
                    console.log(config);
                    var minbet = args[0]
                    console.log(minbet);
                    console.log("Current Min Bet " + config.mincoinbet);
                    console.log("Min Bet from message " + minbet);
                    config.mincoinbet = minbet;
                    console.log("Min Bet After " + config.mincoinbet);
                    var jsonConfig = JSON.stringify(config)
                    console.log(jsonConfig);
                    fs.writeFile('./config.json', jsonConfig, err => {
                        if (err) {
                            console.log('Error writing file', err)
                        } else {
                            console.log('Successfully wrote file')
                            message.channel.send("Successfully Set Minium Bet to: " + config.mincoinbet);
                        }
                      })
                } else {
                    message.channel.send(`<@${message.author.id}>, ${args[0]} is not a valid number`);
                }
            } else {
                message.channel.send(`<@${message.author.id}>, Please provide a valid argument/number`);
            }
        }
    }
}
