const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const item_handler = require('../points/item_handler');
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'use-item',
    description: 'Use an Item in your inventory',
    args: 'Item Name - For Spaces use Underscores',
    active: true,
    econ: true,
    async execute(message, args, bot){
        use_item(message,args,bot);
    }
}

async function use_item(message,args,bot){
    if(args[0]){
        console.log(args[0]);
        itemName = args[0].replaceAll('_', " ");
        console.log(itemName);
        item = item_handler.fetchItem(itemName, true);
        console.log(item);
        await points_manager.useItem(message.author.id, item, message).then(function(result){
            console.log(result);
            message.channel.send(`<@${message.author.id}>, You have successfully used the Item: ${item.name}`);
        }).catch((err) =>{
            console.log(err);
            message.channel.send(err);
            return;
        });
    }
}