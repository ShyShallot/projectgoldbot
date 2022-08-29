const config = require('../config.json'); // basic config file read
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
const path = require('path');
const points_manager = require('../points/manager');
module.exports = {
    name: 'heistecon',
    description: 'Heist System',
    async execute(heist, state){
        serverID = '631008739830267915';
        switch(state){
            case 0:
                Loss(heist);
                break;
            case 1:
                Gain(heist);
                break;
        }
        
        return true;
    }
}

function Loss(heist){
    for(i=0;i<heist.users.length;i++){
        curUser = heist.users[i];
        amount = (CostOfEquipment(curUser) + MaxPossibleRewardLoss(heist) + 50000 + CostOfDamages(heist)); 
        ClearUsersInventory(curUser);
        points_manager.giveUserPoints(curUser.id, amount*-1, 'cash');
    }
}

function Gain(heist){
    for(i=0;i<heist.users.length;i++){
        curUser = heist.users[i];
        amount = CalculateCut(curUser, heist);
        points_manager.giveUserPoints(curUser.id, amount, 'cash');
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

function CalculateCut(user, heist){
    usersCut = user.split;
    maxpossiblereward = heist.location.maxreward;
    cut = ((maxpossiblereward*heist.users.length)/100)*usersCut;
    return cut;
}

function HeistLocationData(){
    filePath = path.join(__dirname, 'locations.json');
    heistlocationdata = fs.readFileSync(filePath);
    heistlocations = JSON.parse(heistlocationdata);
    return heistlocations;
}


function UserHeistInfo(file){
    userheistinforaw = fs.readFileSync(file);
    userheistinfo = JSON.parse(userheistinforaw);
    return userheistinfo;
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
    possibleReward = heist.location.maxreward;

    return possibleReward / heist.users.length;
}

function CostOfDamages(heist){
    locationDiff = heist.location.difficulty;
    return 5000 * locationDiff * heist.users.length;
}

function ClearUsersInventory(user){
    inventory = HeistInvData();
    console.log(`Clearing users inventory`);
    for(i=0;i<inventory.users.length;i++){
        curUser = inventory.users[i];
        if(user.id == curUser.id){
            inventory.users[i].inv.splice(i,curUser.inv.length);
            filePath = path.join(__dirname, 'usersinventory.json');
            pglibrary.WriteToJson(inventory, filePath);
            console.log(`Cleared User ${user.name}'s inventory`);
        }
    }
}