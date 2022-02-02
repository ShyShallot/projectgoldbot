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
            case 'store':
                listItems(message,args);
                break;
            case 'buy-item':
                buyItem(message,args);
                break;
            case 'delete-item':
                deleteItem(message,args);
                break;
            case 'buy-item':
                buyItem(message,args);
                break;
            case 'use-item':
                useItem(message,args);
                break;
            case 'inv':
            case 'inventory':
                viewInventory(message,args);
                break;
            case 'work':
                userWork(message,args);
                break;
            case 'set-econ-symbol':
                setEconomySymbol(message,args);
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
            message.channel.send(`<@${message.author.id}>, You gave <@${target.id}> ${dB.pointSymbol}${pglibrary.commafy(amount)}`);
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
            message.channel.send(`<@${message.author.id}>, You donated ${dB.pointSymbol}${pglibrary.commafy(amount)} to <@${target.id}>!`);
        } else {
            message.channel.send(`Please Mention a Valid Target/Provide an Amount and Location Arg`);
        }
    }
}

async function getUserBalance(message, target){
    dB = points_manager.fetchData();
    leaderboardArray = points_manager.sortForLeaderboard();
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
        for(i=0;i<leaderboardArray.length;i++){
            if(leaderboardArray[i].username === target.user.username){
                position = i;
            }
        }
        balanceEmbed.title = target.user.username;
        balanceEmbed.description = `Leaderboard Ranking: ${position+1}`;
        balanceEmbed.fields[0].value = `${dB.pointSymbol}${pglibrary.commafy(cash)}`;
        balanceEmbed.fields[1].value = `${dB.pointSymbol}${pglibrary.commafy(bank)}`;
        balanceEmbed.fields[2].value = `${dB.pointSymbol}${pglibrary.commafy(cash+bank)}`;
        message.channel.send({embeds:[balanceEmbed]});
    } else {
        [cash,bank] = points_manager.getUserBalance(message.author.id);
        for(i=0;i<leaderboardArray.length;i++){
            if(leaderboardArray[i].username === message.author.username){
                position = i;
            }
        }
        balanceEmbed.description = `Leaderboard Ranking: ${position+1}`;
        balanceEmbed.fields[0].value = `${dB.pointSymbol}${pglibrary.commafy(cash)}`;
        balanceEmbed.fields[1].value = `${dB.pointSymbol}${pglibrary.commafy(bank)}`;
        balanceEmbed.fields[2].value = `${dB.pointSymbol}${pglibrary.commafy(cash+bank)}`;
        message.channel.send({embeds:[balanceEmbed]});
    }
}

function getTotalServerStats(message){
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
        leaderEmbed.addField(`${start+i}. ${user.username}`, `${dB.pointSymbol}${pglibrary.commafy(user.total)}`);
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
        console.log(args[0]);
        if(args[0] == "all"){
            console.log(`Provided Arg is all of users balance`);
            [cash,bank] = points_manager.getUserBalance(message.author.id);
            amount = cash;
        } else if(args[0] == 'half'){
            [cash,bank] = points_manager.getUserBalance(message.author.id);
            amount = Math.round(cash/2);
        } else {
            amount = parseInt(args[0]);
            if(isNaN(amount)){
                message.channel.send(`<@${message.author.id}>, The Provided amount was not a number`);
                return;
            }
        }
        console.log(amount);
        err = points_manager.depositPoints(message.author.id, amount);
        if(err){
            message.channel.send(err);
        } else {
            message.channel.send(`<@${message.author.id}>, You have successfully deposited ${dB.pointSymbol}${pglibrary.commafy(amount)}`);
        }
    } else {
        message.channel.send(`<@${message.author.id}>, Please provide a valid argument`);
    }
}

function withdrawCash(message,args){
    if(args[0]){
        console.log(args[0]);
        if(args[0] == "all"){
            console.log(`Provided Arg is all of users balance`);
            [cash,bank] = points_manager.getUserBalance(message.author.id);
            amount = bank;
        } else if(args[0] == 'half'){
            [cash,bank] = points_manager.getUserBalance(message.author.id);
            amount = Math.round(bank/2);
        } else {
            amount = parseInt(args[0]);
            if(isNaN(amount)){
                message.channel.send(`<@${message.author.id}>, The Provided amount was not a number`);
                return;
            }
        }
        console.log(amount);
        err = points_manager.withdrawPoints(message.author.id, amount);
        if(err){
            message.channel.send(err);
        } else {
            message.channel.send(`<@${message.author.id}>, You have successfully withdrew ${dB.pointSymbol}${pglibrary.commafy(amount)}`);
        }
    } else {
        message.channel.send(`<@${message.author.id}>, Please provide a valid argument`);
    }
}

function createItem(message,args){
    if(!(message.member.roles.cache.find(role => role.name === config.modrole))){
        message.channel.send(`<@${message.author.id}>, You do Not Have Permission for this Command`);
    }
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

function createItemEmbed(start,message){
    if(!start){
        start = 0;
    }
    items = item_handler.fetchItems();
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
        itemEmbed.addField(`${item.name}`, `Cost: ${dB.pointSymbol}${item.price}, Type: ${type}`);
    }
    return itemEmbed;
}

async function listItems(message,args){
    items = item_handler.fetchItems();
    if(items.length <= 0){
        message.channel.send(`<@${message.author.id}>, This server doesn't have any Items`);
        return;
    }
    start = 0;
    const fit = items.length <= 10;
    const embed = await message.channel.send({embeds:[await createItemEmbed(0, message)], components: fit ? []: [new MessageActionRow({components: [forwardButton]})]});
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

function deleteItem(message,args){
    if(!(message.member.roles.cache.find(role => role.name === config.modrole))){
        message.channel.send(`<@${message.author.id}>, You do Not Have Permission for this Command`);
    }
    err = item_handler.deleteItem(message,args);
    if(err){
        message.channel.send(err);
        return;
    } else {
        itemName = args[0].replace('_', " ");
        message.channel.send(`<@${message.author.id}>, You have deleted ${itemName}`);
        return;
    }
}

function buyItem(message,args){
    if(!args[0]){
        message.channel.send(`<@${message.author.id}>, Missing Item Name Argument`);
        return;
    }
    let user = points_manager.fetchUser(message.author.id, true);
    let dB = points_manager.fetchData();
    if(user.inv.length >= dB.maxInventorySize){
        message.channel.send(`<@${message.author.id}>, Your Inventory is full, please remove items to buy another`);
        return;
    }
    item = item_handler.fetchItem(args[0], true);
    if(typeof item === 'string'){
        message.channel.send(item);
        return;
    } else {
        [cash,bank] = points_manager.getUserBalance(message.author.id);
        if(cash >= item.price){
            if(args[1]){
                numberArg = parseInt(args[1]);
                if(!isNaN(numberArg)){
                    if(numberArg >= 2){
                        if(cash >= item.price*numberArg){
                            points_manager.giveUserPoints(message.author.id, (item.price*numberArg)*-1, 'cash');
                            points_manager.giveUserItem(message.author.id, item, numberArg);
                            message.channel.send(`<@${message.author.id}>, You have successfully bought ${item.name} ${numberArg} times for ${dB.pointSymbol}${item.price*numberArg}`);
                        } else {
                            message.channel.send(`<@${message.author.id}>, You do not have enough have for this action.`);
                        }
                    } else {
                        points_manager.giveUserPoints(message.author.id, item.price*-1, 'cash');
                        points_manager.giveUserItem(message.author.id, item);
                        message.channel.send(`<@${message.author.id}>, You have successfully bought ${item.name} for ${dB.pointSymbol}${item.price}`);
                    }
                } else {
                    message.channel.send(`<@${message.author.id}>, A Second Argument was not a Number`);
                }
            } else {
                points_manager.giveUserPoints(message.author.id, item.price*-1, 'cash');
                points_manager.giveUserItem(message.author.id, item);
                message.channel.send(`<@${message.author.id}>, You have successfully bought ${item.name} for ${dB.pointSymbol}${item.price}`);
            }
        } else {
            message.channel.send(`<@${message.author.id}>, You do not have enough have for this action.`);
        }
    }
}

function useItem(message,args){
    if(args[0]){
        itemName = args[0].replace('_, " ');
        item = item_handler.fetchItem(itemName, true);
        err = points_manager.useItem(message.author.id, item);
        if(err){
            message.channel.send(err);
            return;
        } else{
            message.channel.send(`<@${message.author.id}>, You have successfully used the Item: ${item.name}`);
            return;
        }
    }
}

function viewInventory(message,args){
    target = message.mentions.members.first();
    if(target){
        userObject = target;
        targted = true;
    } else {
        userObject = message.author;
    }  
    user = points_manager.fetchUser(userObject.id, true);
    if(!user){
        message.channel.send(`<@${message.author.id}>, That user does not exist in the Database`);
        return;
    }
    if(user.inv.length <= 0){
        if(typeof targted === 'boolean'){
            message.channel.send(`<@${message.author.id}>, Their Inventory is Empty`);
            return;
        }   
        message.channel.send(`<@${message.author.id}>, Your Inventory is Empty`);
        return;
    }
    
    itemEmbed = new MessageEmbed()
    .setTitle(`${userObject.username}'s Inventory`)
    .setTimestamp()
    .setColor(0x00AE86);
    for(i=0;i<user.inv.length;i++){
        item = user.inv[i];
        itemEmbed.addField(`**${i+1}.${item.name}**`,`⠀`);
    }
    message.channel.send({content: `<@${message.author.id}>`, embeds: [itemEmbed]});
}

function userWork(message,args){
    dB = points_manager.fetchData();
    amount = pglibrary.getRandomInt(35000);
    amount *= dB.pointsMulti;
    workStrings = [
        `You Worked at a Tech Job for ${pglibrary.getRandomInt(18)} Hours and drank ${pglibrary.getRandomInt(5)} cups of coffee and earned ${dB.pointSymbol}${pglibrary.commafy(amount)}`, 
        `You Slammed your head on a table ${pglibrary.getRandomInt(21)} times and won ${dB.pointSymbol}${pglibrary.commafy(amount)}!`,
        `You scammed ${pglibrary.getRandomInt(7)} old people and unfortunately got away with ${dB.pointSymbol}${pglibrary.commafy(amount)}, hope you rot!`
    ]
    workStatus = points_manager.work(message.author.id,amount);
    if(workStatus == 'false'){
        message.channel.send(`<@${message.author.id}>, You are on work cooldown for ${((dB.workCooldownTime/1000)/60)/60} Hours`);
    } else {
        randomString = workStrings[pglibrary.getRandomInt(workStrings.length)];
        message.channel.send(`<@${message.author.id}>, ${randomString}`);
    }
}
function setEconomySymbol(message,args){
    if(!(message.member.roles.cache.find(role => role.name === config.modrole))){
        message.channel.send(`<@${message.author.id}>, You do Not Have Permission for this Command`);
    }
    if(args[0]){
        points_manager.setEconSymbol(args[0]);
    }
}