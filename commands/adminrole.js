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
            guildConfig = await masterdb.getGuildJson(message.guild.id,"config");
            guildConfig.modrole = message.mentions.roles.first().name;
            await masterdb.writeGuildJsonFile(message.guild.id,"config",guildConfig).then((status => {
                console.log(status);
                message.channel.send(`<@${message.author.id}>, Successfully set the ADmin Role to: ${message.mentions.roles.first().name}`);
            })).catch((err)=>{
                console.error(err);
                message.channel.send(`<@${message.author.id}>, Failed to set Role, Either Try again or Contact Support`);
            });
        } else {
            message.channel.send(`<@${message.author.id}>, Please Mention a role`);
        }
  }
}