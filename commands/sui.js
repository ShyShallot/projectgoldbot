const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json'); // basic config file read
const { Client } = require('unb-api'); // define our basic client for the UNB-API
const client = new Client(config.econtoken); // define the rest of the client for economy and verify with our econ token
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
// this file handles buying, selling and price check of stocks
module.exports = {
    name: 'sui',
    description: 'hell', 
    execute(message, args, bot){
        if(args[0]){
            argN = parseInt(args[0]);
            if (typeof argN == `number`) {
                if(argN >= 1 && argN < 23) {
                    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
                    stockdata = JSON.parse(stockfile);
                    finaljsonfile = {"stocks": stockdata.stocks, "stockmarketactive": stockdata.stockmarketactive, "maxownedstocks": stockdata.maxownedstocks, "lastupdatehour":stockdata.lastupdatehour,"updateinterval":argN};
                    pglibrary.WriteToJson(finaljsonfile, './stockmarket.json');
                    message.channel.send(`<@${message.author.id}>, successfuly set the Stock Market Update Interval to ${argN}.`);
                    return;
                } else {
                    message.channel.send(`<@${message.author.id}>, only numbers 1-23 are valid.`);
                }
            } else {
                message.channel.send(`<@${message.author.id}>, please provide a valid number`);
                return;
            }
        } else {
            message.channel.send(`<@${message.author.id}>, please provide valid argument.`);
            return;
        }
    }
}