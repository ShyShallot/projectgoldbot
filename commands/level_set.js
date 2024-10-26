const fs = require('fs');
const levels = require('../levels/level_handler');
const config = require('../config.json'); // basic load of config file
const pglibrary = require("../libraryfunctions.js");
const lvl_mng = require('../levels/level_handler');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
const { LogAction } = require('../logfunctions.js');
module.exports = {
    name: 'setlvl',
    description: 'Sets Level or XP to targeted User, Note that it adds for XP and Sets for Level',
    args: 'First Arg: User Mention | Second Arg: xp or level | Third Arg: XP or Level to Give/Set',
    active: true,
    admin: true,
    level: true,
    async execute(message, args, bot){
        guildId = message.guild.id;
        if(!message.mentions.users.first()){message.channel.send(`<@${message.author.id}>, Please Target a Valid User.`); return;}
        if(!args[1]){message.channel.send(`<@${message.author.id}>, Please select xp or level to give`); return;}
        if(!args[2]){message.channel.send(`<@${message.author.id}>, Please provide a valid argument`); return;}
        if(isNaN(parseInt(args[2]))){message.channel.send(`<@${message.author.id}>, Please provide a valid number`); return;}
        if(args[1] == "xp"){
            bool = true;
            string = `gave <@${message.mentions.users.first().id}> ${args[2]} XP`;
            LogAction(`User ${message.author.username} has set ${message.mentions.users.first().username}'s XP to ${args[2]}`, `Xp Set`, bot, message.guild.id)
        } else if(args[1] == "level"){
            bool = false;
            string = `set <@${message.mentions.users.first().id}> to Level ${args[2]}`;
            LogAction(`User ${message.author.username} has set ${message.mentions.users.first().username}'s Level to ${args[2]}`, `Xp Set`, bot, message.guild.id)
        }
        await lvl_mng.setUserData(message.mentions.users.first().id, parseInt(args[2]), bool,guildId);
        message.channel.send(`<@${message.author.id}>, Successfully ${string}`);

        
    }
}
