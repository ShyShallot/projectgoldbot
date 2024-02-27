const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
const { LogAction } = require('../logfunctions.js');
module.exports = {
    name: 'set-econ-symbol',
    description: "Set the Server's Economy Symbol - Mod Only",
    args: 'Any Text/Emoji',
    active: true,
    admin: true,
    econ: true,
    async execute(message, args, bot){
        if(args[0]){
            points_manager.setEconSymbol(args[0], message.guild.id);

            LogAction(`User ${message.author.username} has set the Econ Prefix Role to: ${args[0]}`, `Econ Prefix Set`, bot, message.guild.id)
        }
    }
}