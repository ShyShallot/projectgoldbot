const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
const masterdb = require('../master-db/masterdb');
module.exports = {
    name: 'give',
    description: 'Give a User your points if you can afford it',
    args: '1. [Mention User] | 2. Point Amount | 3. Location: Cash/Bank | 4. (Mod Only) false - Used to give points without subtracting from yours',
    active: true,
    econ: true,
    async execute(message, args, bot){
        const dB = await masterdb.getGuildConfig(message.guild.id)
        if(message.member.roles.cache.find(role => role.name === dB.adminrole) && args[3] == `false`){
            if(args[0] && args[1] && args[2]){
                target = message.mentions.members.first();
                target = target.user;
                amount = parseInt(args[1]);
                err = await points_manager.giveUserPoints(target.id, amount, args[2], true, message.guild.id);
                if(err){
                    message.channel.send(err);
                    return;
                }
                message.channel.send(`<@${message.author.id}>, You gave <@${target.id}> ${dB.point_symbol}${pglibrary.commafy(amount)}`);
            } else {
                message.channel.send(`Please Mention a Valid Target/Provide an Amount and Location Arg`);
            }
        } else {
            if(args[0] && args[1] && args[2]){
                target = message.mentions.members.first();
                target = target.user;
                amount = parseInt(args[1]);
                location = args[2];
                err = await points_manager.donatePoints(message.author.id, target.id, amount, location ,message.guild.id);
                if(err){
                    message.channel.send(err);
                    return;
                }
                message.channel.send(`<@${message.author.id}>, You donated ${dB.point_symbol}${pglibrary.commafy(amount)} to <@${target.id}>!`);
            } else {
                message.channel.send(`Please Mention a Valid Target/Provide an Amount and Location Arg`);
            }
        }
    }
}