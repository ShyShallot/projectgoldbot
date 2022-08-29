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
    econ: true,
    async execute(message, args, bot,guildId){
        dB = await point_handler.fetchData(guildId);
        amount = pglibrary.getRandomInt(35000);
        amount *= dB.pointsMulti;
        [users,userIndex] = await point_handler.fetchUser(message.author.id,false,guildId);
        if(users[userIndex].workCooldown){
            message.channel.send(`<@${message.author.id}>, You are too damn tired, you can work in ${Math.round(Math.abs(((users[userIndex].setOnCooldown+dB.workCooldownTime-Date.now())/(1000*60*60)) % 24))} hour(s)`);
            return;
        }
        point_handler.work(message.author.id,amount,guildId);
        string_handler.replacePlaceholder('work', amount,guildId).then((result) => {
            console.log(result);
            message.channel.send(`<@${message.author.id}>, ${result}`);
        }).catch((result) => {
            console.log(result);
            message.channel.send(`<@${message.author.id}>, ${result}`);
        })
    }
}