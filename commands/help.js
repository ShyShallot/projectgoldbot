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
            if(command){
                var helpembed = new MessageEmbed()
                .setColor(0xFF4500)
                .addField(`Command info for ${command.name}`, `About this command: **${command.description}**. Arguments: **${command.args}**`);
                message.channel.send({embeds: [helpembed]});
                return;
            } else {
                command = commands.econ.get(args[0]);
                var helpembed = new MessageEmbed()
                .setColor(0xFF4500)
                .addField(`Command info for ${command.name}`, `About this command: **${command.description}**. Arguments: **${command.args}**`);
                message.channel.send({embeds: [helpembed]});
                return;
            }
        }
        var helpembed = new MessageEmbed()
        .setTitle("Project Gold Help Menu")
        .setAuthor(`${bot.user.username}`, `${bot.user.avatarURL()}`)
        .setColor(0xFF4500)
        .addField("Bot Info: ", `My Prefix: **${config.prefix}**. You can find my source code at: https://github.com/ShyShallot/projectgoldbot`)
        .addField("Commands", "1")
        .addField("Economy Comamnds", '1');
        var i=0;
        for (const command of commands) { // for every file in our commandFiles Mapping
            i++;
            if(helpembed.fields[1].value.startsWith('1')){
                if(command[1].active){
                    helpembed.fields[1].value = `${command[1].name}, `;
                }
            } else {
                if(command[1].active){
                    if(i+2 == commands.size){
                        console.log(i, commands.size);
                        helpembed.fields[1].value += `${command[1].name}.`;
                    } else {
                        console.log(i, commands.size);
                        helpembed.fields[1].value += `${command[1].name}, `;
                    }
                }
            }
        }
        var i=0;
        for (const command of commands.econ) { // for every file in our commandFiles Mapping
            i++;
            if(helpembed.fields[2].value.startsWith('1')){
                if(command[1].active){
                    helpembed.fields[2].value = `${command[1].name}, `;
                }
            } else {
                if(command[1].active){
                    if(i == commands.econ.size){
                        console.log(i, commands.econ.size);
                        helpembed.fields[2].value += `${command[1].name}.`;
                    } else {
                        console.log(i, commands.econ.size);
                        helpembed.fields[2].value += `${command[1].name}, `;
                    }
                }
            }
        }
        message.channel.send({embeds: [helpembed]});
    }
}