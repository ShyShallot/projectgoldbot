const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const point_handler = require('../points/manager');
const string_handler = require('../stringHandler');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'work',
    description: 'Work a Random Job to make some points',
    args: 'None',
    active: true,
    async execute(message, args, bot){
        dB = point_handler.fetchData();
        amount = pglibrary.getRandomInt(35000);
        amount *= dB.pointsMulti;
        workStatus = point_handler.work(message.author.id,amount);
        if(workStatus == 'false'){
            message.channel.send(`<@${message.author.id}>, You are on work cooldown for ${((dB.workCooldownTime/1000)/60)/60} Hours`);
        } else {
            string_handler.replacePlaceholder('work', amount).then((result) => {
                console.log(result);
                message.channel.send(`<@${message.author.id}>, ${result}`);
            }).catch((result) => {
                console.log(result);
                message.channel.send(`<@${message.author.id}>, ${result}`);
            })
            
        }
    }
}