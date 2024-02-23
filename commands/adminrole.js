const config = require('../config.json');
const Discord = require('discord.js');
const fs = require('fs');
const pglibrary = require('../libraryfunctions');
const masterdb = require('../master-db/masterdb');
module.exports = {
    name: 'adminrole',
    description: 'Sets the Admin Role',
    args: 'First: Role Mention',
    active: true,
    admin: true,
    async execute(message, args, bot){
        if(message.mentions.roles.first()){
            adminRole = message.mentions.roles.first().name;
            await masterdb.editGuildValue(message.guild.id,"adminRole",adminRole)
        } else {
            message.channel.send(`<@${message.author.id}>, Please Mention a role`);
        }
  }
}