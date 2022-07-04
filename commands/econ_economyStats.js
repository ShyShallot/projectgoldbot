const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'econ-stats',
    description: 'Get the Total of all the points in the server',
    args: 'None',
    active: true,
    econ: true,
    async execute(message, args, bot){
        [cash,bank,total] = points_manager.getServerStats();
        balanceEmbed = new MessageEmbed()
        .setTitle(`Server Total Stats`)
        .setTimestamp()
        .setColor(0x00AE86)
        .addField('Cash:', `${dB.pointSymbol}${pglibrary.commafy(cash)}`, true)
        .addField('Bank:', `${dB.pointSymbol}${pglibrary.commafy(bank)}`, true)
        .addField('Total:', `${dB.pointSymbol}${pglibrary.commafy(total)}`, true);
        message.channel.send({embeds:[balanceEmbed]});
    }
}