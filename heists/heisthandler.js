const fs = require('fs');
const masterdb = require('../master-db/masterdb');
const points_manager = require('../points/manager');
const pglibrary = require('../libraryfunctions');
async function CoolDownData(guildId){
    cooldown = await masterdb.getGuildJson(guildId,'heistcooldowns');
    return cooldown;
}

async function FinishHeist(userId,guildId,bot){
    heistFile = JSON.parse(fs.readFileSync(`./heists/heist-${userId}-${guildId}.json`)); // we could just pass the data but we should refresh the data just in case something changes
    guildPntDB = await points_manager.fetchData(guildId);
    usersInHeist = 1 + (heistFile.users.length/10);
    if(heistFile.users.length == 1){
        usersInHeist = 1;
    }
    diffMulti = 1 + heistFile.location.difficulty/10;
    extras = await checkForOptReqs(heistFile)/10;
    chance = Math.random()*diffMulti* usersInHeist - extras;
    await HeistPayout(heistFile,chance);
    cooldownData = await CoolDownData(guildId);
    guildInv = await masterdb.getGuildJson(heistFile.server,'heistinventories');
    heistFile.users.forEach(heistUser => {
        globalInvUserIndex = guildInv.findIndex(user => user.user == heistUser.userid);
        cooldownUser = cooldownData.find(usr => usr.id == heistUser.userid);
        if(typeof cooldownUser !== 'undefined'){return;}
        cooldownData.push({"id":heistUser.userid,cooldown:Date.now()});
        allitems = heistFile.location.reqs.concat(heistFile.location.optionalreqs);
        allitems.forEach(item => {
            if(guildInv[globalInvUserIndex].inv.includes(item)){
                guildInv[globalInvUserIndex].inv.splice(guildInv[globalInvUserIndex].inv.indexOf(item),1);
            }
        });
    });
    await masterdb.writeGuildJsonFile(guildId,'heistinventories',guildInv);
    await masterdb.writeGuildJsonFile(guildId,'heistcooldowns',cooldownData);
    heistchannel = bot.guilds.cache.get(heistFile.server).channels.cache.get(heistFile.channel);
    usersString = ``;
    heistFile.users.forEach(user => {
        usersString += `<@${user.userid}>, `
    });
    if(chance <= 0.5){
        heistchannel.send(usersString + `The Heist was successful, you all will have your payout of: ${guildPntDB.point_symbol}${pglibrary.commafy(heistFile.location.maxreward)}, Go home and celebrate.`);
    } else if(chance > 0.5 && chance <= 0.55){
        heistchannel.send(usersString + `The Heist was went the wrong way, but you still made it out alive and not in cuffs, Say goodbye to the money and well as your items.`);
    } else {
        heistchannel.send(usersString + `The Heist was a complete disaster you idiots, you will not only be in cuffs but will lose ${guildPntDB.point_symbol}${pglibrary.commafy(heistFile.location.maxreward)}, Have fun being in debt.`);
    }
    fs.unlinkSync(`./heists/heist-${userId}-${guildId}.json`);
    
    setTimeout(()=> {
        heistchannel.delete();
    },20000)
}

async function checkForOptReqs(data){
    amount = 0;
    guildInv = await masterdb.getGuildJson(data.server,'heistinventories');
    data.users.forEach(user => {
        guildInv.forEach(invUsr => {
            if(user.userid == invUsr.id){
                data.location.optionalreqs.forEach(itm => {
                    if(invUsr.inv.includes(itm)){
                        amount++;
                    }
                });
            }
        });
    });
    return amount;
}

async function HeistPayout(heistData,chance){
    payout = heistData.location.maxreward;
    if(chance > 0.5 && chance <= 0.55){
        payout = 0;
    } else {
        payout *= -1;
    }
    heistData.users.forEach(async user => {
        await points_manager.giveUserPoints(user.userid,payout,'cash',true,heistData.server);
    });
}
module.exports = {FinishHeist};