const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const item_handler = require('../points/item_handler');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'buy-item',
    description: 'Buy an Item from the Item Store',
    args: 'Item Name - For Spaces Use Underscores',
    active: true,
    econ: true,
    async execute(message, args, bot,guildId){
        if(!args[0]){
            message.channel.send(`<@${message.author.id}>, Missing Item Name Argument`);
            return;
        }
        let user = await points_manager.fetchUser(message.author.id, true,guildId);
        let dB = await points_manager.fetchData(guildId);
        if(user.inv.length >= dB.maxInventorySize){
            message.channel.send(`<@${message.author.id}>, Your Inventory is full, please remove items to buy another`);
            return;
        }
        itemName = args[0].replaceAll("_"," ");
        console.log(itemName)
        item = await item_handler.fetchItem(itemName, true,guildId);
        if(typeof item === 'string'){
            message.channel.send(item);
            return;
        } else {
            [cash,bank] = await points_manager.getUserBalance(message.author.id,guildId);
            if(typeof item === 'undefined'){
                console.log(`Could Not Find Item`);
                return;
            }
            if(cash >= item.price){
                if(args[1]){
                    numberArg = parseInt(args[1]);
                    if(!isNaN(numberArg)){
                        if(numberArg >= 2){
                            if(cash >= item.price*numberArg){
                                points_manager.giveUserPoints(message.author.id, (item.price*numberArg)*-1, 'cash',false,guildId);
                                points_manager.giveUserItem(message.author.id, item, numberArg,guildId);
                                message.channel.send(`<@${message.author.id}>, You have successfully bought ${item.name} ${numberArg} times for ${dB.pointSymbol}${item.price*numberArg}`);
                            } else {
                                message.channel.send(`<@${message.author.id}>, You do not have enough have for this action.`);
                            }
                        } else {
                            points_manager.giveUserPoints(message.author.id, item.price*-1, 'cash',false,guildId);
                            points_manager.giveUserItem(message.author.id, item,1,guildId);
                            message.channel.send(`<@${message.author.id}>, You have successfully bought ${item.name} for ${dB.pointSymbol}${item.price}`);
                        }
                    } else {
                        message.channel.send(`<@${message.author.id}>, A Second Argument was not a Number`);
                    }
                } else {
                    points_manager.giveUserPoints(message.author.id, item.price*-1, 'cash',false,guildId);
                    points_manager.giveUserItem(message.author.id, item,1,guildId);
                    message.channel.send(`<@${message.author.id}>, You have successfully bought ${item.name} for ${dB.pointSymbol}${item.price}`);
                }
            } else {
                message.channel.send(`<@${message.author.id}>, You do not have enough have for this action.`);
            }
        }
    }
}