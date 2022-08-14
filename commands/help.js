const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json');
const masterdb = require('../master-db/masterdb');
module.exports = {
    name: 'help',
    description: 'prints help',
    args: '[Command Name]',
    active: true,
    async execute(message, args, bot){
        commands = bot.commands;
        guildConfig = await masterdb.getGuildJson(message.guild.id,"config");
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
        .addField("Bot Info: ", `Server Prefix: **${guildConfig.prefix}**. You can find my source code at: https://github.com/ShyShallot/projectgoldbot`)
        .addField("Commands", "1")
        .addField("Economy Commands", '1')
        .addField("Level Commands", '1')
        .addField("Admin Commands", '1');
        var i = 0;
        for (const command of commands) { // for every file in our commandFiles Mapping
            i++;
            if(command[1].econ && !command[1].admin){
                field = 2;
            } else if(command[1].level && !command[1].admin){
                field = 3;
            } else if(command[1].admin){
                field = 4;
            } else {
                field = 1;
            }
            if(helpembed.fields[field].value.startsWith('1')){
                if(command[1].active){
                    helpembed.fields[field].value = `${command[1].name}, `;
                }
            } else {
                if(command[1].active){
                    //console.log(i, commands.size);
                    helpembed.fields[field].value += `${command[1].name}, `;
                }
            }
        }
        for(i=1;i<helpembed.fields.length;i++){
            //console.log(helpembed.fields[i]);
            newStr = helpembed.fields[i].value.slice(0,-2) + ".";
            //console.log(newStr);
            helpembed.fields[i].value = newStr;
        }
        message.channel.send({embeds: [helpembed]});
    }
}