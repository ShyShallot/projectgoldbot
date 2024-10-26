const fs = require('fs');
const levels = require('../levels/level_handler');
const config = require('../config.json'); // basic load of config file
const pglibrary = require("../libraryfunctions.js");
const lvl_mng = require('../levels/level_handler');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
const masterdb = require('../master-db/masterdb.js');
const { LogAction } = require('../logfunctions.js');
module.exports = {
    name: 'removelvlreward',
    description: 'Gives rank to user on level requirement',
    args: 'First Arg: Level to Remove',
    active: true,
    admin: true,
    level: true,
    async execute(message, args, bot){
        if(!args[0]){message.channel.send(`<@${message.author.id}>, Please provide a valid argument.`); return;}
        if(isNaN(parseInt(args[0]))){message.channel.send(`<@${message.author.id}>, Please provide a valid number.`); return;}
        guildId = message.guild.id;
        const role = await lvl_mng.getRoleReward(args[0],guildId,bot)
        if(role === null){
            message.channel.send(`<@${message.author.id}>, Role Reward Doesn't Exist`);
            return
        }
        lvl_mng.removeRoleReward(args[0],guildId);
        message.channel.send(`<@${message.author.id}>, Successfully removed Reward for Level ${args[0]}`);
        LogAction(`User ${message.author.username} has removed the Level Reward ${role.name} for Level ${args[0]}`, `Level Reward Remove`, bot, message.guild.id)
    }
}
