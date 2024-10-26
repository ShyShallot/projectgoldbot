const {MessageEmbed} = require('discord.js');
const config = require('../config.json');
module.exports = {
    name: 'stafflist',
    description: 'lists staff',
    execute(message, args, bot){
        const ListEmbed = new MessageEmbed()
        .setTitle('Current Staff List:')
        .setColor(0xFF4500)
        .setDescription(message.guild.roles.cache.get('631010418273419294').members.map(m=>m.user.tag).join('\n'));
    message.channel.send(`<@${message.author.id}>` + ListEmbed); 
    }
}