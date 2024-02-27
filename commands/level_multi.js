const fs = require('fs');
const levels = require('../levels/level_handler');
const config = require('../config.json'); // basic load of config file
const pglibrary = require("../libraryfunctions.js");
const lvl_mng = require('../levels/level_handler');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
const masterdb = require('../master-db/masterdb.js');
const { LogAction } = require('../logfunctions.js');
module.exports = {
    name: 'levelmulti',
    description: 'Sets the Server Multiplier',
    args: 'First Arg: Number | Second Optional Arg: Math Operations (*,+,/,-,=)',
    active: true,
    admin: true,
    level: true,
    async execute(message, args, bot){
        if(typeof parseInt(args[0]) === 'number'){
            if(typeof args[1] === 'undefined'){
                args[1] == '=';
            }
            guildId = message.guild.id;
            await lvl_mng.setMultiplier(parseInt(args[0]), args[1],guildId);
            db = await masterdb.getGuildConfig(guildId)
            message.channel.send(`<@${message.author.id}>, Successfully set the Level Multiplier to: ${db.xpMultiplier}`)

            LogAction(`User ${message.author.username} has set the Xp Multiplier to: ${args[0]/1000} Seconds`, `Xp Multiplier Set`, bot, message.guild.id)
        }
    }
}
