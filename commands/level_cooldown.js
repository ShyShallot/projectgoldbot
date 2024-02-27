const fs = require('fs');
const levels = require('../levels/level_handler');
const config = require('../config.json'); // basic load of config file
const pglibrary = require("../libraryfunctions.js");
const lvl_mng = require('../levels/level_handler');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
const { LogAction } = require('../logfunctions.js');
module.exports = {
    name: 'levelcooldown',
    description: 'Sets the Server Level Cooldown per Message',
    args: 'First Arg: Time in Seconds',
    active: false,
    admin: true,
    level: true,
    async execute(message, args, bot){
        if(typeof parseInt(args[0]) === 'number'){
            await lvl_mng.setCooldown(parseInt(args[0]),message.guild.id);
            message.channel.send(`<@${message.author.id}>, Successfully set the Message XP Cooldown to: ${args[0]/1000} Seconds`);
            LogAction(`User ${message.author.username} has set the Points From Message Cooldown to: ${args[0]/1000} Seconds`, `PfM Cooldown Set`, bot, message.guild.id)
        }
    }
}
