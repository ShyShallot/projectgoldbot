const fs = require('fs');
const levels = require('../levels/level_handler');
const config = require('../config.json'); // basic load of config file
const pglibrary = require("../libraryfunctions.js");
const lvl_mng = require('../levels/level_handler');
const masterdb = require('../master-db/masterdb');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
const { LogAction } = require('../logfunctions.js');
module.exports = {
    name: 'lvlrewards',
    description: 'Gives rank to user on level requirement',
    args: 'First Arg: Role Mention OR list | Second Arg: Level',
    active: true,
    admin: true,
    level: true,
    async execute(message, args, bot){
        var guildId = message.guild.id;
        if(args[0] == "list"){
            let rewards = await lvl_mng.getRoleRewards(guildId);
            console.log(rewards);
            var rewardEmbed = new MessageEmbed()
            .setTitle("Server's Level Rewards")
            .setAuthor(`${bot.user.username}`, `${bot.user.avatarURL()}`)
            .setColor(0xFF4500)
            .addField("Bot Info: ", `Server Prefix: **${await masterdb.getGuildConfig(guildId).prefix}**. You can find my source code at: https://github.com/ShyShallot/projectgoldbot`)
            .addField("Roles", "1");
            for(var i=0;i<rewards.length;i++){
                if(rewardEmbed.fields[1].value == "1"){
                    rewardEmbed.fields[1].value = `Level: ${rewards[i].level}, Role: <@&${rewards[i].roleID}> \n`;
                }
                rewardEmbed.fields[1].value += `Level: ${rewards[i].level}, Role: <@&${rewards[i].roleID}> \n`;
            }
            message.channel.send({embeds: [rewardEmbed]});
            return;
        }
        if(args.length != 2){message.channel.send(`<@${message.author.id}>, Not Enough Args`); return;}
        roleMention = message.mentions.roles.first();
        if(!roleMention){message.channel.send(`<@${message.author.id}>, No Role Mentioned`); return;}
        level = parseInt(args[1]);
        if(isNaN(level)){message.channel.send(`<@${message.author.id}>, Provided Level is not a Number`);return;}
        await lvl_mng.setRoleReward(roleMention.id, level,guildId).catch((err) => {
            console.error(err);
            return;
        });
        message.channel.send(`<@${message.author.id}>, Added ${roleMention.name} to Level ${level}`);

        LogAction(`User ${message.author.username} has added the Role ${roleMention.name} as Reward for Level ${level}`, `Level Reward Add`, bot, message.guild.id)
    }
}
