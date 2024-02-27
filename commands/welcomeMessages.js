const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json');
const pglibrary = require("../libraryfunctions");
const masterdb = require('../master-db/masterdb');
const { LogAction } = require('../logfunctions');
module.exports = {
    name: 'welcomemsgs',
    description: `Set the Join and Leave Messages, leave/join message has to be in quotes like "Welcome to the Server"`,
    args: 'join | leave [content] OR channel [channel id]',
    active: true,
    admin: true,
    async execute(message, args, bot,guildId){
        switch (args[0]){
            case 'W':
            case 'w':
            case 'Welcome':
            case 'welcome':
                if(args[1]){
                    await masterdb.editGuildValue(guildId, "welcomeMessage", message.content.split('"')[1])
                    message.channel.send(`Successfully Set Welcome Message to: ${message.content.split('"')[1]}`);

                    LogAction(`User ${message.author.username} has set the Welcome Message to ${message.content.split('"')[1]}`, `Welcome Message Set`, bot, message.guild.id)
                }
                break;
            case 'L':
            case 'l':
            case 'leave':
            case 'Leave':
                if(args[1]){
                    await masterdb.editGuildValue(guildId, "leaveMessage", message.content.split('"')[1])
                    message.channel.send(`Successfully Set Leave Message to: ${message.content.split('"')[1]}`);

                    LogAction(`User ${message.author.username} has set the Leave Message to ${message.content.split('"')[1]}`, `Leave Message Set`, bot, message.guild.id)
                }
                break;
            case 'channel':
                if(args[1]){
                    if(bot.guilds.cache.get(guildId).channels.cache.get(args[1]) == undefined){
                        message.channel.send("Invalid channel id!");
                        return;
                    }
                    await masterdb.editGuildValue(guildId, "welcomeChannel", args[1])
                    message.channel.send(`Successfully Set Welcome Channel to: ${args[1]}`);

                    LogAction(`User ${message.author.username} has set the Welcome Channel to ${bot.guilds.cache.get(guildId).channels.cache.get(args[1]).name}`, `Welcome Channel Set`, bot, message.guild.id)
                }
                break;
            default:
                message.channel.send("Invalid First Argument");
        }
    }
}
