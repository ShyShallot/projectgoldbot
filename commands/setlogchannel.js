const config = require('../config.json');
const Discord = require('discord.js');
const fs = require('fs');
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const masterdb = require('../master-db/masterdb');
const { LogAction } = require('../logfunctions.js');
module.exports = {
    name: 'logchannelset',
    description: 'Set the Log Channel of the bot, Mod Only',
    args: 'ID Of the Log Channel',
    active: true,
    admin: true,
    async execute(message, args, bot,guildId){
        console.log(args);
        if(!args || args.length == 0){
            message.channel.send(`<@${message.author.id}>, please provide a valid argument`);
            return;
        }
        logchannel = bot.channels.cache.get(args[0]);
        if(!logchannel){
            message.channel.send(`<@${message.author.id}>, please provide a valid channel id`);
            return;
        }

        await masterdb.editGuildValue(guildId, "logchannel",args[0])
        message.channel.send(`<@${message.author.id}>, Log Channel successfully set to #${logchannel.name}`);

        LogAction(`User ${message.author.username} has set the Log Channel to ${logchannel.name}, ID: ${logchannel.id}`, `Log Channel Set`, bot, message.guild.id)
    }
}