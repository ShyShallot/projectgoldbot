const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'reset-user',
    description: "Reset a User's Economy Stats - Mod Only!",
    args: 'Mention Target User',
    active: false,
    admin: true,
    econ: true,
    async execute(message, args, bot){
        if(message.member.roles.cache.find(role => role.name === config.modrole)){
            if(args[0]){
                target = message.mentions.members.first();
                if(!target){
                    message.channel.send(`Cannot Find a Valid User from that mention`);
                    return;
                }
                points_manager.resetUser(target);
                message.channel.send(`<@${message.author.id}>, You have reset ${target.id}'s Balance`);
            } else {
                message.channel.send(`Please Mention a Valid Target/Provide an Amount and Location Arg`);
            }
        }
    }
}