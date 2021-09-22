const config = require('../config.json'); // basic config file read
const { Client, User } = require('unb-api'); // define our basic client for the UNB-API
const client = new Client(config.econtoken); // define the rest of the client for economy and verify with our econ token
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
const path = require('path');
module.exports = {
    name: 'heistecon',
    description: 'Heist System',
    async execute(user, heist, state){
        serverID = '631008739830267915';
        switch(state){
            case 0:
                amount = (CostOfEquipment(user) + MaxPossibleRewardLoss(heist) + 50000 + CostOfDamages(heist)) * 1; 
                ClearUsersInventory(user);
                break;
            case 1:
                amount = CalculateCut(user, heist);
                break;
        }
        client.editUserBalance(serverID, user.id, {cash: amount, bank: 0});
    }
}

function HeistItemData(){
    filePath = path.join(__dirname, 'items.json');
    heistequipsdata = fs.readFileSync(filePath);
    heistequipment = JSON.parse(heistequipsdata);
    return heistequipment;
}

function HeistInvData(){
    filePath = path.join(__dirname, 'usersinventory.json');
    heistinvdata = fs.readFileSync(filePath);
    heistinv = JSON.parse(heistinvdata);
    return heistinv;
}


function HeistLocationData(){
    heistlocationdata = fs.readFileSync(`locations.json`);
    heistlocations = JSON.parse(heistlocationdata);
    return heistlocations;
}


function UserHesitInfo(file){
    userheistinforaw = fs.readFileSync(file);
    userheistinfo = JSON.parse(userheistinforaw);
    return userheistinfo;
}


function CalculateCut(user, heist){
    usersCut = user.split;
    maxpossiblereward = heist.location[0].maxreward;
    cut = (maxpossiblereward/100)*usersCut;
    return cut;
}

function CostOfEquipment(user){
    console.log(`Calculating Cost of Equipment`);
    items = HeistItemData();
    inventory = HeistInvData();
    finalcost = 0;
    for(i=0;i<inventory.users.length;i++){
        curUser = inventory.users[i];
        console.log(curUser);
        if(curUser.id == user.id) {
            items.items.forEach(item => {
                console.log(item);
                if(curUser.inv.includes(item.name)){
                    finalcost += item.cost;
                    console.log(finalcost);
                }
            })
        }
    }
    console.log(finalcost);
    return finalcost;
}

function MaxPossibleRewardLoss(heist){
    possibleReward = heist.location[0].maxreward;

    return possibleReward / heist.users.length;
}

function CostOfDamages(heist){
    locationDiff = heist.location[0].difficulty;
    return 5000 * locationDiff * heist.users.length;
}

function ClearUsersInventory(user){
    inventory = HeistInvData();
    console.log(`Clearing users inventory`);
    for(i=0;i<inventory.users.length;i++){
        curUser = inventory.users[i];
        curUser.inv = [];
        pglibrary.WriteToJson(inventory, `usersinventory.json`);
        console.log(`Cleared Uses inventory`);
    }
}