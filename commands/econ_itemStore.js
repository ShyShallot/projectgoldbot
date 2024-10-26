const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('../points/manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
const masterdb = require('../master-db/masterdb.js');
module.exports = {
    name: 'store',
    description: "Lists all items available in the Server's Item Store",
    args: 'None',
    active: true,
    econ: true,
    async execute(message, args, bot,guildId){
        let dB = await masterdb.getGuildConfig(guildId)
        let items = dB.items
        if(items.length <= 0){
            message.channel.send(`<@${message.author.id}>, This server doesn't have any Items`);
            return;
        }
        start = 0;
        const fit = items.length <= 10;
        const embed = await message.channel.send({embeds:[await createItemEmbed(0, message,guildId)], components: fit ? []: [new MessageActionRow({components: [forwardButton]})]});
        if(fit) return;
        const interactCollect = embed.createMessageComponentCollector({
            filter: ({user}) => user.id = message.author.id
        });
        interactCollect.on('collect', async interaction => {
            interaction.customId === backId ? (start -= 10) : (start += 10)
            await interaction.update({
                embeds: [await createItemEmbed(start, message)],
                components: [
                    new MessageActionRow({
                        components: [
                            ...(start ? [backButton] : []),
                            ...(start + 10 < items.length ? [forwardButton]: [])
                        ]
                    })
                ]
            })
        })
    }
}

async function createItemEmbed(start,message,guildId){
    if(!start){
        start = 0;
    }
    items = await points_manager.fetchItems(guildId);
    dB = await points_manager.fetchData(guildId);
    startArray = items.slice(start, start+10);
    itemEmbed = new MessageEmbed()
    .setTitle(`${message.guild.name}'s Item Store - Items: ${start+1}-${start+startArray.length} out of ${items.length} Items`)
    .setTimestamp()
    .setColor(0x00AE86);
    for(i=0;i<startArray.length;i++){
        item = startArray[i];
        if(start == 0){
            start = 1
        }
        if(typeof item.func !== 'undefined'){
            type = "Instant"
        } else {
            type = "Use"
        }
        itemEmbed.addField(`${item.name}`, `Cost: ${dB.point_symbol}${pglibrary.commafy(item.price)}, Type: ${type}`);
    }
    return itemEmbed;
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