const fs = require('fs');
const levels = require('../levels/level_handler');
const config = require('../config.json'); // basic load of config file
const pglibrary = require("../libraryfunctions.js");
const lvl_mng = require('../levels/level_handler');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'addlvlreward',
    description: 'Gives rank to user on level requirement',
    args: 'First Arg: Role Mention | Second Arg: Level',
    active: true,
    admin: true,
    level: true,
    async execute(message, args, bot){
        if(args.length != 2){message.channel.send(`<@${message.author.id}>, Not Enough Args`); return;}
        roleMention = message.mentions.roles.first();
        if(!roleMention){message.channel.send(`<@${message.author.id}>, No Role Mentioned`); return;}
        level = parseInt(args[1]);
        if(isNaN(level)){message.channel.send(`<@${message.author.id}>, Provided Level is not a Number`);return;}
        lvl_mng.setRoleReward(roleMention.id, level);
        message.channel.send(`<@${message.author.id}>, Added ${roleMention.name} to Level ${level}`);
    }
}
