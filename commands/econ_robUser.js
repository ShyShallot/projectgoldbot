const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'rob',
    description: 'Rob a user to make some points',
    args: 'Target a User via Mention',
    active: true,
    econ: true,
    async execute(message, args, bot){
        guildId = message.guild.id;
        target = message.mentions.members.first();
        if(!target){
            message.channel.send(`<@${message.author.id}>, Please Mention a Valid User`);
            return;
        }
        [targetCash,targetBank] = await points_manager.getUserBalance(target.id,guildId);
        if(targetCash <= 1000){
            message.channel.send(`<@${message.author.id}>, That Person is too broke to be robbed`);
            return;
        }
        amountToSteal = pglibrary.getRandomInt(Math.round(targetCash*0.75));
        await points_manager.giveUserPoints(message.author.id,amountToSteal,'cash',true,guildId);
        await points_manager.giveUserPoints(target.id,-amountToSteal,'cash',true,guildId);
        message.channel.send(`<@${message.author.id}>, You are quite the evil person but you stole ${points_manager.symbol()}${amountToSteal} from ${target.user.username}!`);
    }
}