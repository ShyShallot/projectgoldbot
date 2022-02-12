const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const string_handler = require('../stringHandler');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'crime',
    description: 'Become the criminal',
    args: 'None',
    active: true,
    async execute(message, args, bot){
        dB = points_manager.fetchData();
        failChance = 1;
        failAmount = pglibrary.getRandomInt(15000);
        let randomChance = Math.random();
        console.log(randomChance);
        if(failChance >= randomChance) {
            string_handler.replacePlaceholder('fail', failAmount).then((result) =>{
                console.log(result);
                message.channel.send(result);
            }).catch((result)=>{
                console.log(result);
                message.channel.send(result);
            })
            
            //points_manager.work(message.author.id,failAmount);
            return;
        }

    }
}