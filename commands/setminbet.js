const Discord = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const masterdb = require('../master-db/masterdb');
const { LogAction } = require('../logfunctions.js');
module.exports = {
    // this shit is a mess
    name: 'setminbet',
    description: 'set the minimum bet',
    args: 'A number of any value',
    active: true,
    admin: true,
    async execute(message, args, bot,guildId){
        if(args[0]){
            bet = parseInt(args[0]);
            if(!isNaN(bet)){
                await masterdb.editGuildValue(guildId,"mincoinbet",bet).then((status) => {
                    message.channel.send(`Successfully Set Server Minimum Bet to: ${bet} points.`);

                    LogAction(`User ${message.author.username} has set the Server Minimum Bet to ${bet}`, `Min Bet Set`, bot, message.guild.id)
                });
            } else {
                message.channel.send(`<@${message.author.id}>, ${args[0]} is not a valid number`);
            }
        } else {
            message.channel.send(`<@${message.author.id}>, Please provide a valid argument/number`);
        }
    }
}
