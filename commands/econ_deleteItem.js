const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');

const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'delete-item',
    description: 'Delete the Item from the Servers Item Store - Mod Only',
    args: 'Item Name - For Spaces Use Underscores',
    active: true,
    admin: true,
    econ: true,
    async execute(message, args, bot){
        err = points_manager.deleteItem(message,args);
        if(typeof err === 'string'){
            message.channel.send(err);
            return;
        } else {
            itemName = args[0].replaceAll('_', " ");
            message.channel.send(`<@${message.author.id}>, You have deleted ${itemName}`);
            return;
        }
    }
}