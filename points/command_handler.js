const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('./manager');
const {MessageEmbed, Message, MessageActionRow, MessageButton} = require('discord.js');
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
const item_handler = require('./item_handler');
module.exports = {
    commandHandler(command,bot,args,message){
        points_manager.dir = "./points/"
        switch(command){
            case 'give':
                givePoints(message,args);
                break;
            case 'balance':
            case 'bal':
                target = message.mentions.members.first();
                getUserBalance(message,target);
                break;
            case 'econ-stats':
                getTotalServerStats(message);
                break;
            case 'leaderboard':
            case 'lb':
                getLeaderboard(message);
                break;
            case 'reset-econ':
                resetEconomy(message);
                break;
            case 'reset-user':
                resetUser(message, args);
                break;
            case 'dep':
            case 'deposit':
                depositCash(message,args);
                break;
            case 'wtd':
            case 'withdraw':
                withdrawCash(message,args);
                break;
            case 'create-item':
                createItem(message,args);
                break;
            case 'list-items':
                listItems(message,args);
                break;
            case 'buy-item':
                buyItem(message,args);
                break;
        }
    }
}

function givePoints(message,args){
    if(message.member.roles.cache.find(role => role.name === config.modrole) && args[3] == `false`){
        if(args[0] && args[1] && args[2]){
            target = message.mentions.members.first();
            amount = parseInt(args[1]);
            err = points_manager.giveUserPoints(target.id, amount, args[2]);
            if(err){
                message.channel.send(err);
                return;
            }
            message.channel.send(`<@${message.author.id}>, You gave <@${target.id}> ${pglibrary.commafy(amount)} points!`);
        } else {
            message.channel.send(`Please Mention a Valid Target/Provide an Amount and Location Arg`);
        }
    } else {
        if(args[0] && args[1] && args[2]){
            target = message.mentions.members.first();
            amount = parseInt(args[1]);
            err = points_manager.donatePoints(message.author.id, target.id, amount, args[2]);
            if(err){
                message.channel.send(err);
                return;
            }
            message.channel.send(`<@${message.author.id}>, You donated ${pglibrary.commafy(amount)} of your points to <@${target.id}>!`);
        } else {
            message.channel.send(`Please Mention a Valid Target/Provide an Amount and Location Arg`);
        }
    }
}

function getUserBalance(message, target){
    balanceEmbed = new MessageEmbed()
    .setTitle(message.author.username)
    .setDescription(`Leaderboard Ranking: Not Yet`)
    .setTimestamp()
    .setColor(0x00AE86)
    .addField('Cash:', "1", true)
    .addField('Bank:', '1', true)
    .addField('Total:', '1', true);
    if(target){
        [cash,bank] = points_manager.getUserBalance(target.id);
        balanceEmbed.title = target.user.username;
        balanceEmbed.fields[0].value = `${cash} points`;
        balanceEmbed.fields[1].value = `${bank} points`;
        balanceEmbed.fields[2].value = `${cash+bank} points`;
        message.channel.send({embeds:[balanceEmbed]});
    } else {
        [cash,bank] = points_manager.getUserBalance(message.author.id);
        balanceEmbed.fields[0].value = `${pglibrary.commafy(cash)} points`;
        balanceEmbed.fields[1].value = `${pglibrary.commafy(bank)} points`;
        balanceEmbed.fields[2].value = `${pglibrary.commafy(cash+bank)} points`;
        console.log(balanceEmbed)
        message.channel.send({embeds:[balanceEmbed]});
    }
}

function getTotalServerStats(message){
    [cash,bank,total] = points_manager.getServerStats();
    balanceEmbed = new MessageEmbed()
    .setTitle(`Server Total Stats`)
    .setTimestamp()
    .setColor(0x00AE86)
    .addField('Cash:', `${pglibrary.commafy(cash)}`, true)
    .addField('Bank:', `${pglibrary.commafy(bank)}`, true)
    .addField('Total:', `${pglibrary.commafy(total)}`, true);
    message.channel.send({embeds:[balanceEmbed]});
}

function createLeaderboardEmbed(start,message){
    if(!start){
        start = 0;
    }
    leaderboardArray = points_manager.sortForLeaderboard();
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
        leaderEmbed.addField(`${start+i}. ${user.username}`, `${pglibrary.commafy(user.total)}`);
    }
    return leaderEmbed;
}

async function getLeaderboard(message){
    start = 0;
    leaderboardArray = points_manager.sortForLeaderboard();
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

function resetEconomy(message){
    if(message.member.roles.cache.find(role => role.name === config.modrole)){
        points_manager.firstSetup(true);
        message.channel.send(`${message.author.id} has reset the economy`);
    } else {   
        message.channel.send(`<@${message.author.id}>, You Do not have perms for such an action`);
    }
}

function resetUser(message, args){
    if(message.member.roles.cache.find(role => role.name === config.modrole)){
        if(args[0]){
            target = message.mentions.members.first();
            if(!target){
                message.channel.send(`Cannot Find a Valid User from that mention`);
                return;
            }
            points_manager.resetUser(target);
            message.channel.send(`<@${message.author.id}>, You have reset ${target.id}'s Balance`);
        } else {
            message.channel.send(`Please Mention a Valid Target/Provide an Amount and Location Arg`);
        }
    }
}

function depositCash(message,args){
    if(args[0]){
        if(args[0] == "all"){
            [cash,bank] = points_manager.getUserBalance(message.author.id);
            args[0] == cash;
        } else if(args[0] == half){
            [cash,bank] = points_manager.getUserBalance(message.author.id);
            args[0] == Math.round(cash/2);
        }
        err = points_manager.depositPoints(message.author.id, args[0]);
        if(err){
            message.channel.send(err);
        } else {
            message.channel.send(`<@${message.author.id}>, You have successfully deposited ${pglibrary.commafy(args[0])} points`);
        }
    } else {
        message.channel.send(`<@${message.author.id}>, Please provide a valid argument`);
    }
}

function withdrawCash(message,args){
    if(args[0]){
        if(args[0] == "all"){
            [cash,bank] = points_manager.getUserBalance(message.author.id);
            args[0] == cash;
        } else if(args[0] == half){
            [cash,bank] = points_manager.getUserBalance(message.author.id);
            args[0] == Math.round(cash/2);
        }
        err = points_manager.withdrawPoints(message.author.id, args[0]);
        if(err){
            message.channel.send(err);
        } else {
            message.channel.send(`<@${message.author.id}>, You have successfully withdrew ${pglibrary.commafy(args[0])} points`);
        }
    } else {
        message.channel.send(`<@${message.author.id}>, Please provide a valid argument`);
    }
}

function createItem(message,args){
    newItem = item_handler.createItem(message,args);
    if(typeof newItem == 'string'){
        message.channel.send(newItem);
        return;
    } else {
        if(typeof newItem.func !== 'undefined'){
            type = "Instant"
        } else {
            type = "Use"
        }
    }
    itemEmbed = new MessageEmbed()
    .setTitle(`${newItem.name}`)
    .setTimestamp()
    .setColor(0x00AE86)
    .addField('Name', `${newItem.name}`, true)
    .addField('Cost:', `${newItem.price}`, true)
    .addField('Item Type:', `${type}`, true);
    message.channel.send({embeds:[itemEmbed]});
}

function listItems(message,args){
    items = item_handler.fetchItems();

}