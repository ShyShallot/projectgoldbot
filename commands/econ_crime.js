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
        guildId = message.guild.id;
        [users,userIndex] = await points_manager.fetchUser(message.author.id,false,guildId);
        db = await points_manager.fetchData(guildId);
        if(users[userIndex].crimeCooldown){
            message.channel.send(`<@${message.author.id}>, You have too much heat and cannot commit a crime for ${Math.round(Math.abs(((users[userIndex].lastCrime+dB.crimeCooldownTime-Date.now())/(1000*60*60)) % 24))} hour(s)`);
            return;
        }
        failChance = 0.45;
        failAmount = pglibrary.getRandomInt(15000);
        let randomChance = Math.random();
        console.log(randomChance);
        if(failChance >= randomChance) {
            points_manager.crime(message.author.id, -failAmount,guildId);
            string_handler.replacePlaceholder('fail', failAmount,guildId).then((result) => {
                sendResult(result,message);
            }).catch((result)=>{
                sendResult(result,message);
            })
            return;
        } 
        amount = pglibrary.getRandomInt(85000);
        string_handler.replacePlaceholder('crime',amount,guildId).then((result) => {
            points_manager.crime(message.author.id, amount,guildId);
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