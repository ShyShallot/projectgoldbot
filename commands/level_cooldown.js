const fs = require('fs');
const levels = require('../levels/level_handler');
const config = require('../config.json'); // basic load of config file
const pglibrary = require("../libraryfunctions.js");
const lvl_mng = require('../levels/level_handler');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'levelcooldown',
    description: 'Sets the Server Level Cooldown per Message',
    args: 'First Arg: Time in Seconds',
    active: true,
    admin: true,
    level: true,
    async execute(message, args, bot){
        if(typeof parseInt(args[0]) === 'number'){
            lvl_mng.setCooldown(parseInt(args[0]));
            db = lvl_mng.fetchData();
            message.channel.send(`<@${message.author.id}>, Successfully set the Message XP Cooldown to: ${db.messageCooldownTime/1000} Seconds`);
        }
    }
}
