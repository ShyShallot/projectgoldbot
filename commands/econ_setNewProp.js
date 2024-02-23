const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const point_handler = require('../points/manager');
const string_handler = require('../stringHandler');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'seteconprop',
    description: 'Adds a new Property for all users, HAS TO BE DEFINED IN SCRIPT ALREADY (ADMIN ONLY)',
    args: "1. Property Name (No Spaces) | 2. Property Value (NO SPACES) (Don't provide a value to remove the property) |",
    active: false,
    admin: true,
    econ: true,
    async execute(message, args, bot){
        guildId = message.guild.id;
        if(!args[0]){
            message.channel.send(`<@${message.author.id}>, missing First args`);
            return;
        }
        if(!args[1]){
            returnStats = await point_handler.removePropGlobal(args[0],guildId);
            message.channel.send(`${message.author.id}, ${returnStats}`);
        } else {
            switch (args[1]){
                case 'true':
                case 'True':
                    args[1] = true;
                    break;
                case 'false':
                case 'False':
                    args[1] = false;
                    break;
                case 'null':
                case 'Null':
                    args[1] = null;
                    break;
            }
            returnStats = await point_handler.addNewPropGlobal(args[0], args[1],guildId);
            message.channel.send(`${message.author.id}, ${returnStats}`);
        }
    }
}