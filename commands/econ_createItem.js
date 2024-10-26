const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');

const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'create-item',
    description: 'Create an Item - Mod Only',
    args: '1. Item Name (for Spaces Use an Underscore) | 2. Cost of Item | 3. Item Type (Only role at the Moment) | 4. Item Type Arg ',
    active: true,
    admin: true,
    econ: true,
    async execute(message, args, bot){
        newItem = await points_manager.createItem(message,args,guildId);
        if(typeof newItem == 'string'){
            message.channel.send(newItem);
            return;
        } else {
            if(typeof newItem.func !== 'undefined'){
                type = "Instant"
            } else {
                type = "Use"
            }
        }
        itemEmbed = new MessageEmbed()
        .setTitle(`${newItem.name.replaceAll("_", " ")}`)
        .setTimestamp()
        .setColor(0x00AE86)
        .addField('Name', `${newItem.name.replaceAll("_", " ")}`, true)
        .addField('Cost:', `${pglibrary.commafy(newItem.price)}`, true)
        .addField('Item Type:', `${type}`, true);
        message.channel.send({embeds:[itemEmbed]});
    }
}