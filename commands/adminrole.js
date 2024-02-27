const config = require('../config.json');
const Discord = require('discord.js');
const fs = require('fs');
const pglibrary = require('../libraryfunctions');
const masterdb = require('../master-db/masterdb');
const { LogAction } = require('../logfunctions');
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

            LogAction(`User ${message.author.username} has set the Admin Role to: ${adminRole}`, `Admin Role Set`, bot, message.guild.id)
        } else {
            message.channel.send(`<@${message.author.id}>, Please Mention a role`);
        }
  }
}