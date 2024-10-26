const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
const masterdb = require('../master-db/masterdb.js');
module.exports = {
    name: 'balance',
    nicks:["bal"],
    description: 'Check your or another Users Balance',
    args: '1. [Mention User] (Optional)',
    active: true,
    econ: true,
    async execute(message, args, bot){
        var dB = await masterdb.getGuildConfig(message.guild.id)
        var leaderboardArray = await points_manager.sortForLeaderboard(message.guild.id);
        var point_symbol = dB.point_symbol;
        var balanceEmbed = new MessageEmbed()
        .setTitle(message.author.username)
        .setDescription(`Leaderboard Ranking: Not Yet`)
        .setTimestamp()
        .setColor(0x00AE86)
        .addField('Cash:', "1", true)
        .addField('Bank:', '1', true)
        .addField('Total:', '1', true);
        let user = message.author;
        let target = message.mentions.members.first();
        if(target){
            user = target;
        }
        [bank,cash] = await points_manager.getUserBalance(user.id,message.guild.id);
        for(i=0;i<leaderboardArray.length;i++){
            if(leaderboardArray[i].username === user.username){
                position = i;
            }
        }
        balanceEmbed.description = `Leaderboard Ranking: ${position+1}`;
        balanceEmbed.fields[0].value = `${point_symbol}${pglibrary.commafy(cash)}`;
        balanceEmbed.fields[1].value = `${point_symbol}${pglibrary.commafy(bank)}`;
        balanceEmbed.fields[2].value = `${point_symbol}${pglibrary.commafy(cash+bank)}`;
        message.channel.send({embeds:[balanceEmbed]});
    }
}