const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'reset-econ',
    description: 'Reset the Economy for the Entire Server - Mod Only!',
    args: 'None',
    active: false,
    admin: true,
    econ: true,
    async execute(message, args, bot){
        if(message.member.roles.cache.find(role => role.name === config.modrole)){
            points_manager.setup(true);
            message.channel.send(`${message.author.id} has reset the economy`);
        } else {   
            message.channel.send(`<@${message.author.id}>, You Do not have perms for such an action`);
        }
    }
}