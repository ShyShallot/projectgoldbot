const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json');
module.exports = {
    name: 'help',
    description: 'prints help',
    args: '[Command Name]',
    execute(message, args, bot, commands){
        console.log(args);
        if(args[0]){
            command = commands.get(args[0]);
            console.log(command);
            if(command){
                var helpembed = new MessageEmbed()
                .setColor(0xFF4500)
                .addField(`Command info for ${command.name}`, `About this command: **${command.description}**. Arguments: **${command.args}**`);
                message.channel.send({embeds: [helpembed]});
                return;
            }
        }
        console.log(commands);
        var helpembed = new MessageEmbed()
        .setTitle("Project Gold Help Menu")
        .setAuthor(`${bot.user.username}`, `${bot.user.avatarURL()}`)
        .setColor(0xFF4500)
        .addField("Bot Info: ", `My Prefix: **${config.prefix}**, My Economy Prefix: **${config.econprefix}**. You can find my source code at: https://github.com/ShyShallot/projectgoldbot`)
        .addField("Commands", "1");
        for (const command of commands) { // for every file in our commandFiles Mapping
            console.log(command);
            if(helpembed.fields[1].value.startsWith('1')){
                if(command[1].active){
                    helpembed.fields[1].value = `${command[1].name}, `;
                }
            } else {
                if(command[1].active){
                    helpembed.fields[1].value += `${command[1].name}, `;
                }
            }
        }
        message.channel.send({embeds: [helpembed]});
    }
}