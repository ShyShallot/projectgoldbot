const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json');
const pglibrary = require("../libraryfunctions");
const masterdb = require('../master-db/masterdb');
module.exports = {
    name: 'welcomemsgs',
    description: `Set the Join and Leave Messages, leave/join message has to be in quotes like "Welcome to the Server"`,
    args: 'join/leave "Message Content"',
    active: true,
    admin: true,
    async execute(message, args, bot,guildId){
        switch (args[0]){
            case 'W':
            case 'w':
            case 'Welcome':
            case 'welcome':
                if(args[1]){
                    guildConfig = await masterdb.getGuildJson(guildId,"config");
                    guildConfig.newUserMessages[0] = message.content.split('"')[1];
                    await masterdb.writeGuildJsonFile(guildId,"config",guildConfig);
                    message.channel.send(`Successfully Set Welcome Message to: ${message.content.split('"')[1]}`);
                }
                break;
            case 'L':
            case 'l':
            case 'leave':
            case 'Leave':
                if(args[1]){
                    guildConfig = await masterdb.getGuildJson(guildId,"config");
                    guildConfig.newUserMessages[1] = message.content.split('"')[1];
                    await masterdb.writeGuildJsonFile(guildId,"config",guildConfig);
                    message.channel.send(`Successfully Set Leave Message to: ${message.content.split('"')[1]}`);
                }
                break;
            default:
                message.channel.send("Invalid First Argument");
        }
    }
}
