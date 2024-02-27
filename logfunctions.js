const { MessageEmbed } = require("discord.js");
const masterdb = require("./master-db/masterdb");

async function LogAction(body, title, bot, guildId){
    serverConfig = await masterdb.getGuildConfig(guildId)
    logchannel = bot.guilds.cache.get(guildId).channels.cache.get(serverConfig.logchannel);
    if(!logchannel){
        console.log(`INVALID LOG CHANNEL CANCELING!`);
        return;
    }
    date = new Date();
    logEmbed = new MessageEmbed()
    .setTitle(title)
    .setDescription(body)
    .setTimestamp()
    .setAuthor(`${bot.user.username}`, `${bot.user.avatarURL()}`)
    .setColor(0x00AE86);
    logchannel.send({embeds: [logEmbed]});
}

module.exports = {LogAction};