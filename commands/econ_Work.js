const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'work',
    description: 'Work a Random Job to make some points',
    args: 'None',
    active: true,
    async execute(message, args, bot){
        dB = points_manager.fetchData();
        amount = pglibrary.getRandomInt(35000);
        amount *= dB.pointsMulti;
        workStrings = [
            `You Worked at a Tech Job for ${pglibrary.getRandomInt(18)} Hours and drank ${pglibrary.getRandomInt(5)} cups of coffee and earned ${dB.pointSymbol}${pglibrary.commafy(amount)}`, 
            `You Slammed your head on a table ${pglibrary.getRandomInt(21)} times and won ${dB.pointSymbol}${pglibrary.commafy(amount)}!`,
        ]
        workStatus = points_manager.work(message.author.id,amount);
        if(workStatus == 'false'){
            message.channel.send(`<@${message.author.id}>, You are on work cooldown for ${((dB.workCooldownTime/1000)/60)/60} Hours`);
        } else {
            randomString = workStrings[pglibrary.getRandomInt(workStrings.length)];
            message.channel.send(`<@${message.author.id}>, ${randomString}`);
        }
    }
}