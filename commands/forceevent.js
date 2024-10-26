const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'forceevent',
    description: 'Force an Event',
    args: '1. event name, 2. member mention',
    active: true,
    admin: true,
    async execute(message, args, bot,guildId){
        let target = message.mentions.members.first();
        if(!target){
            message.channel.send(`<@${message.author.id}>, Please Mention a Valid User`);
            return;
        }

        let event = args[0];

        bot.emit(event, target)
    }
}