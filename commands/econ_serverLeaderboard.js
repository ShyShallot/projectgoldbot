const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
const masterdb = require('../master-db/masterdb.js');
module.exports = {
    name: 'leaderboard',
    nicks:["lb"],
    description: 'Get the Server Leaderboard for most points',
    args: 'None',
    active: true,
    econ: true,
    async execute(message, args, bot){
        start = 0;
        leaderboardArray = await points_manager.sortForLeaderboard(message.guild.id);
        const fit = leaderboardArray.length <= 10;
        const embed = await message.channel.send({embeds:[await createLeaderboardEmbed(0, message)], components: fit ? []: [new MessageActionRow({components: [forwardButton]})]});
        if(fit) return;
        const interactCollect = embed.createMessageComponentCollector({
            filter: ({user}) => user.id = message.author.id
        });
        interactCollect.on('collect', async interaction => {
            interaction.customId === backId ? (start -= 10) : (start += 10)
            await interaction.update({
                embeds: [await createLeaderboardEmbed(start, message)],
                components: [
                    new MessageActionRow({
                        components: [
                            ...(start ? [backButton] : []),
                            ...(start + 10 < leaderboardArray.length ? [forwardButton]: [])
                        ]
                    })
                ]
            })
        })
    }
}

async function createLeaderboardEmbed(start,message){
    if(!start){
        start = 0;
    }
    leaderboardArray = await points_manager.sortForLeaderboard(message.guild.id);
    startArray = leaderboardArray.slice(start, start+10);
    leaderEmbed = new MessageEmbed()
    .setTitle(`${message.guild.name}'s Server Leaderboard - Users: ${start+1}-${start+startArray.length} out of ${leaderboardArray.length} Users`)
    .setTimestamp()
    .setColor(0x00AE86);
    console.log(startArray, startArray.length);
    for(let i = 0;i<startArray.length;i++){
        let user = startArray[i];
        dB = await masterdb.getGuildConfig(message.guild.id)
        leaderEmbed.addField(`${start+1+i}. ${user.username}`, `${dB.point_symbol}${pglibrary.commafy(user.total)}`);
    }
    return leaderEmbed;
}
const backId = 'back';
const forwardId = 'forward';
const backButton = new MessageButton({
    style: 'SECONDARY',
    label: 'Back',
    emoji: '⬅️',
    customId: backId
});
const forwardButton = new MessageButton({
    style: 'SECONDARY',
    label: 'Forward',
    emoji: '➡️',
    customId: forwardId
});