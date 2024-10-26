const fs = require('fs');
const levels = require('../levels/level_handler');
const config = require('../config.json'); // basic load of config file
const pglibrary = require("../libraryfunctions.js");
const lvl_mng = require('../levels/level_handler');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'levelreset',
    description: 'Resets a User or the whole server',
    args: 'server || Mention Target',
    active: false,
    admin: true,
    level: true,
    async execute(message, args, bot){
        guildId = message.guild.id;
        if(args[0] == "server"){
            
            lvl_mng.setup(true,guildId);
        } else {
            target = message.mentions.members.first();
            if(typeof target !== 'undefined'){
                lvl_mng.resetUser(target,guildId);
            } else {
                message.channel.send(`<@${message.author.id}>, please provide a valid argument`);
            }
        }
    }
}
