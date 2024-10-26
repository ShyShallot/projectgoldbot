const fs = require('fs');
const levels = require('../levels/level_handler');
const config = require('../config.json'); // basic load of config file
const pglibrary = require("../libraryfunctions.js");
const masterdb = require('../master-db/masterdb.js');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'resetserver',
    description: 'Resets everything but the server config',
    args: 'None',
    active: true,
    owner: true,
    async execute(message, args, bot){
        await masterdb.resetUserData(message.guild.id,bot);

        message.channel.send(`<@${message.author.id}>, Reset the entire server stats`);
    }
}
