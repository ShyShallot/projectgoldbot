const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'deposit',
    description: 'Deposit all your Points in Cash into the Bank',
    args: 'Amount to Deposit | All/Half is also accepted as an amount',
    active: true,
    econ: true,
    async execute(message, args, bot){
        if(args[0]){
            console.log(args[0]);
            if(args[0] == "all"){
                console.log(`Provided Arg is all of users balance`);
                [cash,bank] = points_manager.getUserBalance(message.author.id);
                amount = cash;
            } else if(args[0] == 'half'){
                [cash,bank] = points_manager.getUserBalance(message.author.id);
                amount = Math.round(cash/2);
            } else {
                amount = parseInt(args[0]);
                if(isNaN(amount)){
                    message.channel.send(`<@${message.author.id}>, The Provided amount was not a number`);
                    return;
                }
            }
            console.log(amount);
            err = points_manager.depositPoints(message.author.id, amount);
            if(err){
                message.channel.send(err);
            } else {
                message.channel.send(`<@${message.author.id}>, You have successfully deposited ${dB.pointSymbol}${pglibrary.commafy(amount)}`);
            }
        } else {
            message.channel.send(`<@${message.author.id}>, Please provide a valid argument`);
        }
    }
}