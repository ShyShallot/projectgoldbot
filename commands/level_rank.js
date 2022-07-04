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
        if(args[1]){
            target = message.mentions.members.first();
            if(typeof target === 'undefined'){
                //message.channel.send(`<@${message.author.id}>, Mentioned User is not a valid target`)
                return;
            } else {
                [level,xp,nextXP] = levels.getUserLevel(target.id);
                embed = Embed(target,level,xp,nextXP);
                message.channel.send({embeds:[embed]});
                return;
            }
        } else {
            [level,xp,nextXP] = levels.getUserLevel(message.author.id);
            embed = Embed(message.author,level,xp,nextXP);
            console.log(embed);
            message.channel.send({embeds:[embed]});
        }
    }
}

function Embed(user,level,xp,nextXP){
    leaderBoard = levels.sortForLeaderboard();
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