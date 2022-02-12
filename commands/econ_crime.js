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
        failChance = 0.45;
        failAmount = pglibrary.getRandomInt(15000);
        let randomChance = Math.random();
        console.log(randomChance);
        if(failChance >= randomChance) {
            err = points_manager.crime(message.author.id, -failAmount);
            if(err === 'false'){
                sendResult(`You are on Cooldown for Crime`,message);
                return;
            }
            string_handler.replacePlaceholder('fail', failAmount).then((result) => {
                sendResult(result,message);
            }).catch((result)=>{
                sendResult(result,message);
            })
            return;
        } 
        amount = pglibrary.getRandomInt(85000);
        string_handler.replacePlaceholder('crime',amount).then((result) => {
            err = points_manager.crime(message.author.id, amount);
            console.log(err);
            if(err === 'false'){
                sendResult(err);
                return;
            }
            sendResult(result,message);
        }).catch((result) => {
            sendResult(result,message);
        })
    }
}
function sendResult(result,message){
    console.log(result);
    message.channel.send(`<@${message.author.id}>, ${result}`);
}