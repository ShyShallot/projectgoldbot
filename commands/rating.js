const config = require('../config.json');
const Discord = require('discord.js');
const fs = require('fs');
module.exports = {
    name: 'rate',
    active: false,
    description: 'Rate the bot 1-10',
    execute(message, args, bot){
            const ratings = {
                1: 1,
                2: 2,
                3: 3,
                4: 4,
                5: 5,
                6: 6,
                7: 7,
                8: 8,
                9: 9,
                10: 10
            }
            let messagecontent = message.content.substring(message.content.indexOf(" ") + 1, message.content.length);
            if(ratings[messagecontent]){
                message.channel.send(message.author + ": Rated Me a: " + ratings[messagecontent])
            } else {
                message.channel.send(message.author + ": Please pick a number between 1-10")
            }
            
  }
}