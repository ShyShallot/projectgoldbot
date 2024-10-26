const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const point_handler = require('../points/manager');
const string_handler = require('../stringHandler');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
const masterdb = require('../master-db/masterdb.js');
module.exports = {
    name: 'work',
    description: 'Work a Random Job to make some points',
    args: 'None',
    active: true,
    econ: true,
    async execute(message, args, bot,guildId){
        dB = await masterdb.getGuildConfig(guildId)
        amount = pglibrary.getRandomInt(35000);
        amount *= dB.points_multi;
        let user = await masterdb.getUser(guildId,message.author.id)
        if(user.work_cooldown){
            message.channel.send(`<@${message.author.id}>, You are too damn tired, you can work in ${Math.round(Math.abs(((user.set_on_cooldown+dB.work_cooldown_time-Date.now())/(1000*60*60)) % 24))} hour(s)`);
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