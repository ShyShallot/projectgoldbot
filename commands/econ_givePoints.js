const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'give',
    description: 'Give a User your points if you can afford it',
    args: '1. [Mention User] | 2. Point Amount | 3. Location: Cash/Bank | 4. (Mod Only) false - Used to give points without subtracting from yours',
    active: true,
    async execute(message, args, bot){
        if(message.member.roles.cache.find(role => role.name === config.modrole) && args[3] == `false`){
            if(args[0] && args[1] && args[2]){
                target = message.mentions.members.first();
                amount = parseInt(args[1]);
                err = points_manager.giveUserPoints(target.id, amount, args[2]);
                if(err){
                    message.channel.send(err);
                    return;
                }
                message.channel.send(`<@${message.author.id}>, You gave <@${target.id}> ${dB.pointSymbol}${pglibrary.commafy(amount)}`);
            } else {
                message.channel.send(`Please Mention a Valid Target/Provide an Amount and Location Arg`);
            }
        } else {
            if(args[0] && args[1] && args[2]){
                target = message.mentions.members.first();
                amount = parseInt(args[1]);
                err = points_manager.donatePoints(message.author.id, target.id, amount, args[2]);
                if(err){
                    message.channel.send(err);
                    return;
                }
                message.channel.send(`<@${message.author.id}>, You donated ${dB.pointSymbol}${pglibrary.commafy(amount)} to <@${target.id}>!`);
            } else {
                message.channel.send(`Please Mention a Valid Target/Provide an Amount and Location Arg`);
            }
        }
    }
}