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
        [users,userIndex] = point_handler.fetchUser(message.author.id);
        db = point_handler.fetchData();
        if(users[userIndex].workCooldown){
            timeDiff = pglibrary.convertMS(Math.abs(users[userIndex].lastCrime+db.workCooldownTime));
            timeDisplay = `${timeDiff.hour} hour(s).`;
            if(timeDiff.hour < 1){
                timeDisplay = `${timeDiff.minute} minutes.`;
            }
            message.channel.send(`<@${message.author.id}>, You are too damn tired, you can work in ${timeDisplay}`);
            return;
        }
        point_handler.work(message.author.id,amount);
        string_handler.replacePlaceholder('work', amount).then((result) => {
            console.log(result);
            message.channel.send(`<@${message.author.id}>, ${result}`);
        }).catch((result) => {
            console.log(result);
            message.channel.send(`<@${message.author.id}>, ${result}`);
        })
    }
}