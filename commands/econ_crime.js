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
    econ: true,
    async execute(message, args, bot){
        [users,userIndex] = points_manager.fetchUser(message.author.id);
        db = points_manager.fetchData();
        if(users[userIndex].crimeCooldown){
            timeDiff = pglibrary.convertMS(Math.abs(users[userIndex].lastCrime+db.crimeCooldownTime));
            timeDisplay = `${timeDiff.hour} hour(s).`;
            if(timeDiff.hour < 1){
                timeDisplay = `${timeDiff.minute} minutes.`;
            }
            message.channel.send(`<@${message.author.id}>, You have too much heat and cannot commit a crime for ${timeDisplay}`);
            return;
        }
        failChance = 0.45;
        failAmount = pglibrary.getRandomInt(15000);
        let randomChance = Math.random();
        console.log(randomChance);
        if(failChance >= randomChance) {
            points_manager.crime(message.author.id, -failAmount);
            string_handler.replacePlaceholder('fail', failAmount).then((result) => {
                sendResult(result,message);
            }).catch((result)=>{
                sendResult(result,message);
            })
            return;
        } 
        amount = pglibrary.getRandomInt(85000);
        string_handler.replacePlaceholder('crime',amount).then((result) => {
            points_manager.crime(message.author.id, amount);
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