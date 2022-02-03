const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'balance',
    description: 'Check your or another Users Balance',
    args: 'Arguments: 1. [Mention User] (Optional)',
    active: true,
    async execute(message, args, bot){
        dB = points_manager.fetchData();
        leaderboardArray = points_manager.sortForLeaderboard();
        balanceEmbed = new MessageEmbed()
        .setTitle(message.author.username)
        .setDescription(`Leaderboard Ranking: Not Yet`)
        .setTimestamp()
        .setColor(0x00AE86)
        .addField('Cash:', "1", true)
        .addField('Bank:', '1', true)
        .addField('Total:', '1', true);
        if(target){
            [cash,bank] = points_manager.getUserBalance(target.id);
            for(i=0;i<leaderboardArray.length;i++){
                if(leaderboardArray[i].username === target.user.username){
                    position = i;
                }
            }
            balanceEmbed.title = target.user.username;
            balanceEmbed.description = `Leaderboard Ranking: ${position+1}`;
            balanceEmbed.fields[0].value = `${dB.pointSymbol}${pglibrary.commafy(cash)}`;
            balanceEmbed.fields[1].value = `${dB.pointSymbol}${pglibrary.commafy(bank)}`;
            balanceEmbed.fields[2].value = `${dB.pointSymbol}${pglibrary.commafy(cash+bank)}`;
            message.channel.send({embeds:[balanceEmbed]});
        } else {
            [cash,bank] = points_manager.getUserBalance(message.author.id);
            for(i=0;i<leaderboardArray.length;i++){
                if(leaderboardArray[i].username === message.author.username){
                    position = i;
                }
            }
            balanceEmbed.description = `Leaderboard Ranking: ${position+1}`;
            balanceEmbed.fields[0].value = `${dB.pointSymbol}${pglibrary.commafy(cash)}`;
            balanceEmbed.fields[1].value = `${dB.pointSymbol}${pglibrary.commafy(bank)}`;
            balanceEmbed.fields[2].value = `${dB.pointSymbol}${pglibrary.commafy(cash+bank)}`;
            message.channel.send({embeds:[balanceEmbed]});
        }
    }
}