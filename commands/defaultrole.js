const fs = require('fs');
const levels = require('../levels/level_handler');
const config = require('../config.json'); // basic load of config file
const pglibrary = require("../libraryfunctions.js");
const lvl_mng = require('../levels/level_handler');
const masterdb = require('../master-db/masterdb');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
const { LogAction } = require('../logfunctions.js');
module.exports = {
    name: 'defaultrole',
    description: 'Set or see the default role',
    args: 'First Arg (Optional): Mention a role',
    active: true,
    admin: true,
    level: true,
    async execute(message, args, bot){
        var guildId = message.guild.id;

        var guildConfig = await masterdb.getGuildConfig(guildId)
        if(!args[0]){
            var rewardEmbed = new MessageEmbed()
            .setTitle("Server's Default")
            .setAuthor(`${bot.user.username}`, `${bot.user.avatarURL()}`)
            .setColor(0xFF4500)
            .addField("Default Role: ", "1");

            var defaultRole = guildConfig.defaultRole
            
            if (defaultRole == undefined) {
                message.channel.send(`<@${message.author.id}>, There is no Default role! Please Set one`);
                return;
            }
            for(var i=0;i<rewards.length;i++){
                rewardEmbed.fields[0].value = `<@&${defaultRole}>`;
            }
            message.channel.send({embeds: [rewardEmbed]});
            return;
        }

        roleMention = message.mentions.roles.first();
        if(!roleMention){message.channel.send(`<@${message.author.id}>, No Role Mentioned`); return;}

        let defaultRoleNew = roleMention.id

        message.channel.send(`<@${message.author.id}>, Set the Default Role to: ${roleMention.name}`);

        LogAction(`User ${message.author.username} has set the Default Role to: ${roleMention.name}`, `Default Role Set`, bot, message.guild.id)

        await masterdb.editGuildValue(guildId,"defaultRole",defaultRoleNew)
    }
}
