const fs = require('fs');
const levels = require('../levels/level_handler');
const config = require('../config.json'); // basic load of config file
const pglibrary = require("../libraryfunctions.js");
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'rank',
    description: "Check's Users Rank and XP",
    args: '1. Mention a Target(optional)',
    active: true,
    level: true,
    async execute(message, args, bot){
        guildId = message.guild.id;
        if(args[0]){
            let target = message.mentions.members.first();
            target = target.user
            if(typeof target === 'undefined'){
                message.channel.send(`<@${message.author.id}>, Mentioned User is not a valid target`)
                return;
            } else {
                [level,xp,nextXP] = await levels.getUserLevel(target.id,guildId);
                embed = await Embed(target,level,xp,nextXP,guildId);
                message.channel.send({embeds:[embed]});
                return;
            }
        } else {
            [level,xp,nextXP] = await levels.getUserLevel(message.author.id,guildId);
            embed = await Embed(message.author,level,xp,nextXP,guildId);
            //console.log(embed);
            message.channel.send({embeds:[embed]});
        }
    }
}

async function Embed(user,level,xp,nextXP,guildId){
    console.log(user)
    leaderBoard = await levels.sortForLeaderboard(guildId);
    for(i=0;i<leaderBoard.length;i++){
        if(leaderBoard[i].username == user.username){
            position = i;
        }
    }
    levelEmbed = new MessageEmbed()
        .setTitle(user.username)
        .setDescription(`Leaderboard Ranking: ${position+1}`)
        .setTimestamp()
        .setColor(0x00AE86)
        .addField('Current Level:', `${level}`, true)
        .addField('Current XP:', `${xp}`, true)
        .addField('XP Till Next Level:', `${nextXP-xp}`, true)
        .addField('XP Required for Next Level', `${nextXP}`, true);
    return levelEmbed;
}