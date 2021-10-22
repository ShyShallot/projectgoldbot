const config = require('../config.json'); // basic config file read
const { Client, User } = require('unb-api'); // define our basic client for the UNB-API
const client = new Client(config.econtoken); // define the rest of the client for economy and verify with our econ token
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
const path = require('path');
const heistEcon = require('./heistecon');
module.exports = {
    name: 'heistecon',
    description: 'Heist System',
    async execute(heist, bot){
        setTimeout(() => EndHeist(heist, bot), heist.location[0].timetocomplete * 3600000);
    }
}

async function EndHeist(heist, bot){
    console.log(`Ending Heist`);
    console.log(heist);
    heistDiff = heist.location[0].difficulty;
    usersInHeistMutli = 1 + heist.users.length /10;
    if(heist.users.length == 1){
        usersInHeistMutli = 1;
    }
    diffMulti = 1 + heistDiff/10;
    usersExtras = CheckForOptionalReqs(heist) / 10;
    chance = Math.random() * diffMulti * usersInHeistMutli - usersExtras;
    console.log(`Final Chance: ${chance}, Modifiers: Difficulty: ${heistDiff}, User Multiplier: ${usersInHeistMutli}, Extras Mutliplier: ${usersExtras}`);
    done = false
    if(chance <= 0.5 && !done){
        done = true;
        await HeistEndWin(heist, bot);
    } else if (chance > 0.5 && chance < 0.6 && !done){
        done = true;
        await HeistEndDraw(heist, bot);
    } else if (chance >= 0.6 && !done){
        done = true;
        await HeistEndLoss(heist, bot);
    }
    cooldownData = CoolDownData();
    console.log(cooldownData);
    for(i=0;i<heist.users.length;i++){
        curUser = heist.users[i];
        console.log(`Current User:`, curUser);
        userdata = {"id": curUser.id};
        console.log(`User Data: ${userdata}`);
        cooldownData.users.push(userdata);
        console.log(cooldownData);
        pglibrary.WriteToJson(cooldownData, `./heists/usersoncooldown.json`);
        setTimeout(() => ClearCooldown(curUser),43200000);
    }
    return;
}

function ClearCooldown(user){
    cooldownData = CoolDownData();
    for(i=0;i<cooldownData.users.length;i++){
        if(cooldownData.users[i].id == user.id){
            cooldownData.users.splice(i, 1);
            pglibrary.WriteToJson(cooldownData, `./heists/usersoncooldown.json`);
        }
    }
}

async function HeistEndWin(heist, bot){
    finalstring = "";
    var hChannel;
    heistEcon.execute(heist, 1);
    for(i=0;i<heist.users.length;i++){
        curUser = heist.users[i];
        finalstring += `<@${curUser.id}>,`;
        if(curUser.host){
            server = bot.guilds.cache.get(heist.serverid);
            username = curUser.name;
            hChannel = server.channels.cache.find(c => c.name == `${username.toLowerCase()}s-heist`);
            console.log(hChannel);
            if(!hChannel){
                console.log(`Could not find that channel`);
                return;
            }   
        }
    }
    finalstring += ` the heist has ended and you have succeeded, you will be rewarded with your cut. (This Channel will auto delete in 10 Seconds)`;
    await hChannel.send(finalstring);
    setTimeout(() => CleanUpHeistInfo(heist, bot), 20000);
    return;
}

async function HeistEndLoss(heist, bot){
    finalstring = "";
    var hChannel;
    heistEcon.execute(heist, 0);
    for(i=0;i<heist.users.length;i++){
        curUser = heist.users[i];
        console.log(curUser);
        finalstring += `<@${curUser.id}>,`;
        if(curUser.host){
            server = bot.guilds.cache.get(heist.serverid);
            console.log(server);
            username = curUser.name;
            console.log(username);
            hChannel = server.channels.cache.find(c => c.name == `${username.toLowerCase()}s-heist`);
            if(!hChannel){
                console.log(`Could not find that channel`);
                return;
            }
            console.log(hChannel);
        }
        await pglibrary.sleep(1000);
    }
    finalstring += ` the heist has ended and you have failed, costs for equipment, damages and bail will be detucted from you balance. (This Channel will auto delete in 10 Seconds)`;
    await hChannel.send(finalstring);
    setTimeout(() => CleanUpHeistInfo(heist, bot), 20000);
    return;
}

async function HeistEndDraw(heist, bot){
    finalstring = "";
    var hChannel;
    for(i=0;i<heist.users.length;i++){
        curUser = heist.users[i];
        finalstring += `<@${curUser.id}>,`;
        if(curUser.host){
            server = bot.guilds.cache.get(heist.serverid);
            username = curUser.name;
            hChannel = server.channels.cache.find(c => c.name == `${username.toLowerCase()}s-heist`);
            if(!hChannel){
                console.log(`Could not find that channel`);
                return;
            }
            console.log(hChannel);
        }
        ClearUsersInventory(curUser);
    }
    finalstring += ` the heist has ended but you retreated, you have only lost your items. (This Channel will auto delete in 10 Seconds)`;
    await hChannel.send(finalstring);
    setTimeout(() => CleanUpHeistInfo(heist, bot), 20000);
    return;
}


function CoolDownData(){
    cooldownRaw = fs.readFileSync(`./heists/usersoncooldown.json`);
    return JSON.parse(cooldownRaw);
}

function CheckForOptionalReqs(heist){
    invRaw = fs.readFileSync(`./heists/usersinventory.json`);
    inv = JSON.parse(invRaw);
    amountOfOpReq = 0;
    for(i=0;i<heist.users.length;i++){
        curUser = heist.users[i];
        for(l=0;l<inv.users.length;l++){
            curUserInv = inv.users[l];
            if(curUserInv.id == curUser){
                curUserInv.inv.forEach(item =>{
                    if(heist.location[0].optionalreqs.includes(item)){
                        amountOfOpReq++;
                    }
                })
            }
        }
    }
    return amountOfOpReq;
}

async function CleanUpHeistInfo(heist, bot){
    for(i=0;i<heist.users.length;i++){
        curUser = heist.users[i];
        if(curUser.host){
            server = bot.guilds.cache.get(heist.serverid);
            username = curUser.name;
            hChannel = server.channels.cache.find(c => c.name == `${username.toLowerCase()}s-heist`);
            hChannel.delete();
            filetodelete = `./heists/heist${curUser.id}.json`;
            fs.unlinkSync(filetodelete, function(err){
                if(err){
                    console.log(`There was an error when trying to delete file, make sure it exists.`);
                    return;
                }
            });
        }
    }
    return true;
}

function ClearUsersInventory(user){
    inventory = HeistInvData();
    console.log(`Clearing users inventory`);
    for(i=0;i<inventory.users.length;i++){
        curUser = inventory.users[i];
        if(user.id == curUser.id){
            inventory.users[i].inv.splice(i,curUser.inv.length);
            pglibrary.WriteToJson(inventory, `./heists/usersinventory.json`);
            console.log(`Cleared Uses inventory`);
        }
    }
}