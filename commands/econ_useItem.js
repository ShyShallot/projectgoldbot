const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'use-item',
    description: 'Use an Item in your inventory',
    args: 'Item Name - For Spaces use Underscores',
    active: true,
    econ: true,
    async execute(message, args, bot,guildId){
        use_item(message,args,bot,guildId);
    }
}

async function use_item(message,args,bot,guildId){
    if(args[0]){
        console.log(args[0]);
        itemName = args[0].replaceAll('_', " ");
        console.log(itemName);
        item = await points_manager.fetchItem(itemName, true,guildId);
        console.log(item);
        await points_manager.useItem(message.author.id, item, message,guildId).then(function(result){
            console.log(result);
            message.channel.send(`<@${message.author.id}>, You have successfully used the Item: ${item.name}`);
        }).catch((err) =>{
            console.log(err);
            message.channel.send(err);
            return;
        });
    }
}