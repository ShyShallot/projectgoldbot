const config = require('../config.json');
const Discord = require('discord.js');
const fs = require('fs');
const pglibrary = require('../libraryfunctions');
const masterdb = require('../master-db/masterdb');
module.exports = {
    name: 'prefix',
    description: 'Sets the Servers Prefix, One Word or Letter Only Anything past a space will be excluded',
    args: 'First: Prefix',
    active: true,
    admin: true,
    async execute(message, args, bot){
        if(typeof args !== 'object'){
            message.channel.send(`<@${message.author.id}>, Please Provide an argument`);
        }
        if(args[0]){
            guildConfig = await masterdb.getGuildJson(message.guild.id,"config");
            guildConfig.prefix = args[0];
            await masterdb.writeGuildJsonFile(message.guild.id,"config",guildConfig).then((status => {
                console.log(status);
                message.channel.send(`<@${message.author.id}>, Successfully set the Server Prefix to: ${args[0]}`);
            })).catch((err)=>{
                console.error(err);
                message.channel.send(`<@${message.author.id}>, Failed to set Prefix, Either Try again or Contact Support`);
            });
        } else {
            message.channel.send(`<@${message.author.id}>, Please Provide an argument`);
        }
  }
}