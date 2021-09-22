const config = require('../config.json'); // basic config file read
const { Client, User } = require('unb-api'); // define our basic client for the UNB-API
const client = new Client(config.econtoken); // define the rest of the client for economy and verify with our econ token
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
module.exports = {
    name: 'heist',
    description: 'Heist System',
    async execute(user, heist, state){
        serverID = 631008739830267915;
        switch(state){
            case 0:
                //loss todo
                break;
            case 1:
                amount = CalculateCut(user, heist);
                break;
            case 2:
                //neither a win nor loss
                break;
        }
        client.editUserBalance(serverID, user.id, {cash: amount, bank: 0});
    }
}

function CalculateCut(user, heist){
    usersCut = user.split;
    maxpossiblereward = heist.location[0].maxreward;
    cut = (maxpossiblereward/100)*usersCut;
    return cut;
}