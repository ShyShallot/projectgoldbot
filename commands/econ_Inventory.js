const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'inventory',
    description: "Check your's or another user's Item Inventory Contents",
    args: 'Arguments: Target User - Optional',
    active: true,
    async execute(message, args, bot){
        target = message.mentions.members.first();
        if(target){
            userObject = target;
            targted = true;
        } else {
            userObject = message.author;
        }  
        user = points_manager.fetchUser(userObject.id, true);
        if(!user){
            message.channel.send(`<@${message.author.id}>, That user does not exist in the Database`);
            return;
        }
        if(user.inv.length <= 0){
            if(typeof targted === 'boolean'){
                message.channel.send(`<@${message.author.id}>, Their Inventory is Empty`);
                return;
            }   
            message.channel.send(`<@${message.author.id}>, Your Inventory is Empty`);
            return;
        }
        
        itemEmbed = new MessageEmbed()
        .setTitle(`${userObject.username}'s Inventory`)
        .setTimestamp()
        .setColor(0x00AE86);
        for(i=0;i<user.inv.length;i++){
            item = user.inv[i];
            itemEmbed.addField(`**${i+1}.${item.name}**`,`⠀`);
        }
        message.channel.send({content: `<@${message.author.id}>`, embeds: [itemEmbed]});
    }
}