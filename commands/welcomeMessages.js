const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json');
const pglibrary = require("../libraryfunctions");
module.exports = {
    name: 'Join and Leave Messages',
    description: `Set the Join and Leave Messages, leave/join message has to be in quotes like "Welcome to the Server"`,
    args: 'join/leave "Message Content"',
    execute(message, args, bot){
        switch (args[0]){
            case 'W':
            case 'w':
            case 'Welcome':
            case 'welcome':
                console.log(message);
                if(args[1]){
                    config.newUserMessages.Welcome = message.content.split('"')[1];
                    pglibrary.WriteToJson(config, './config.json');
                    message.channel.send(`Successfully Set Welcome Message to: ${message.content.split('"')[1]}`);
                }
                break;
            case 'L':
            case 'l':
            case 'leave':
            case 'Leave':
                console.log(message);
                if(args[1]){
                    config.newUserMessages.Leave = message.content.split('"')[1];
                    pglibrary.WriteToJson(config, './config.json');
                    message.channel.send(`Successfully Set Leave Message to: ${message.content.split('"')[1]}`);
                }
                break;
            default:
                message.channel.send("Invalid First Argument");
        }
    }
}
