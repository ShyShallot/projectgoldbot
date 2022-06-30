const fs = require('fs');
const levels = require('../levels/level_handler');
const config = require('../config.json'); // basic load of config file
const pglibrary = require("../libraryfunctions.js");
const lvl_mng = require('../levels/level_handler');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
module.exports = {
    name: 'levellb',
    description: 'Get the Server Leaderboard for levels',
    args: 'None',
    active: true,
    async execute(message, args, bot){
        start = 0;
        leaderboardArray = lvl_mng.sortForLeaderboard();
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

function createLeaderboardEmbed(start,message){
    if(!start){
        start = 0;
    }
    leaderboardArray = lvl_mng.sortForLeaderboard();
    startArray = leaderboardArray.slice(start, start+10);
    leaderEmbed = new MessageEmbed()
    .setTitle(`${message.guild.name}'s Server Leaderboard - Users: ${start+1}-${start+startArray.length} out of ${leaderboardArray.length} Users`)
    .setTimestamp()
    .setColor(0x00AE86);
    for(i=0;i<startArray.length;i++){
        user = startArray[i];
        if(start == 0){
            start = 1
        }
        leaderEmbed.addField(`${start+i}. ${user.username}`, `Level: ${pglibrary.commafy(user.level)}`);
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