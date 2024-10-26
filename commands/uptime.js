const Discord = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const pglibrary = require("../libraryfunctions.js");
const process = require('process');
module.exports = {
    name: 'uptime',
    description: 'Gets the Uptime for the Bot',
    active: true,
    execute(message, args, bot){
        date = new Date(process.uptime()*1000);
        console.log(date);
        message.channel.send(`Uptime Days: ${date.getUTCDate() -1}, Hours: ${date.getUTCHours()}, Minutes: ${date.getUTCMinutes()}, Seconds: ${date.getUTCSeconds()}`);
  }
}