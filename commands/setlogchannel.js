const config = require('../config.json');
const Discord = require('discord.js');
const fs = require('fs');
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
module.exports = {
    name: 'logchannelset',
    description: 'Set the Log Channel of the bot, Mod Only',
    args: 'ID Of the Log Channel',
    execute(message, args, bot){
        modRole = config.modrole;
        console.log(args);
        if(!message.member.roles.cache.find(role => role.name === modRole)){
            message.channel.send(`<@${message.author.id}>, you do not have perms for this command`);
            return;
        }
        if(!args || args.length == 0){
            message.channel.send(`<@${message.author.id}>, please provide a valid argument`);
            return;
        }
        logchannel = bot.channels.cache.get(args[0]);
        if(!logchannel){
            message.channel.send(`<@${message.author.id}>, please provide a valid channel id`);
            return;
        }
        config.logchannel = args[0];
        pglibrary.WriteToJson(config, './config.json');
        message.channel.send(`<@${message.author.id}>, Log Channel successfully set to #${logchannel.name}`);
    }
}