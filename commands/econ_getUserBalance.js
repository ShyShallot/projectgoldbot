const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'balance',
    description: 'Check your or another Users Balance',
    args: '1. [Mention User] (Optional)',
    active: true,
    econ: true,
    async execute(message, args, bot){
        var dB = await points_manager.fetchData(message.guild.id);
        var leaderboardArray = await points_manager.sortForLeaderboard(message.guild.id);
        var pointSymbol = dB.pointSymbol;
        var balanceEmbed = new MessageEmbed()
        .setTitle(message.author.username)
        .setDescription(`Leaderboard Ranking: Not Yet`)
        .setTimestamp()
        .setColor(0x00AE86)
        .addField('Cash:', "1", true)
        .addField('Bank:', '1', true)
        .addField('Total:', '1', true);
        target = message.mentions.members.first();
        if(target){
            [cash,bank] = await points_manager.getUserBalance(target.id,message.guild.id);
            for(i=0;i<leaderboardArray.length;i++){
                if(leaderboardArray[i].username === target.user.username){
                    position = i;
                }
            }
            balanceEmbed.title = target.user.username;
            balanceEmbed.description = `Leaderboard Ranking: ${position+1}`;
            balanceEmbed.fields[0].value = `${pointSymbol}${pglibrary.commafy(cash)}`;
            balanceEmbed.fields[1].value = `${pointSymbol}${pglibrary.commafy(bank)}`;
            balanceEmbed.fields[2].value = `${pointSymbol}${pglibrary.commafy(cash+bank)}`;
            message.channel.send({embeds:[balanceEmbed]});
        } else {
            [cash,bank] = await points_manager.getUserBalance(message.author.id,message.guild.id);
            for(i=0;i<leaderboardArray.length;i++){
                if(leaderboardArray[i].username === message.author.username){
                    position = i;
                }
            }
            balanceEmbed.description = `Leaderboard Ranking: ${position+1}`;
            balanceEmbed.fields[0].value = `${pointSymbol}${pglibrary.commafy(cash)}`;
            balanceEmbed.fields[1].value = `${pointSymbol}${pglibrary.commafy(bank)}`;
            balanceEmbed.fields[2].value = `${pointSymbol}${pglibrary.commafy(cash+bank)}`;
            message.channel.send({embeds:[balanceEmbed]});
        }
    }
}