const {MessageEmbed} = require('discord.js');
const config = require('../config.json');
const { Client } = require('unb-api');
const client = new Client(config.econtoken);
const pglibrary = require("../libraryfunctions.js");
const fs = require('fs'); // File System for JS
// this file handles buying, selling and price check of stocks
module.exports = {
    name: 'stocks',
    description: 'hell',
    execute(message, args, bot){
        if (args[0] == "buy") {
            console.log(args);
            BuyStock(message.author, args, message);
        }
    }
}

function BuyStock(user, args, message) {
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    console.log(stockdata);
    stock = FindStock(args[1]);
    console.log(stock);
    if (typeof stock !== `undefined`) {
        if (args[2]) {
            args[2] = parseInt(args[2]);
            if (typeof args[2] === `number`) {
                console.log(args[2]);
                client.getUserBalance(message.guild.id, user.id).then(econuser => {
                    if ((stock.price * args[2]) <= econuser.cash) {
                        //client.editUserBalance(message.guild.id, user.id, {cash: -stock.price * args[2], bank: 0});
                        GiveUserStock(user, stock, args[2]);
                        message.channel.send(`<@${message.author.id}>, you have bought ${args[2]} of ${stock.name}`);
                    } else {
                        message.channel.send(`<@${message.author.id}>, you don't have enough money for that action.`);
                    }
                })
            } else {
                message.channel.send(`<@${user.id}>, the 3rd Argument provided is not a number`);
            }
        } else {
            message.channel.send(`<@${user.id}>, No 3rd Argument was provided`);
        }
    } else {
        message.channel.send(`<@${user.id}>, Could not find the requested stock.`)
    }
}

function FindStock(requestedstock) {
    if (typeof requestedstock === `undefined`) {
        console.log(`No Stock defined`);
        return;
    }
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    for (i = 0, l = stockdata.stocks.length; i < l; i++) {
        stock = stockdata.stocks[i];
        console.log(`Current Stock: ${stock.name}`);
        console.log(stock);
        stockname = stock.name;
        console.log(stockname);
        if(requestedstock == stockname) {
            return stock;
        } 
    }
}

function GiveUserStock(user, stock, amount) {
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    if (stockdata.userswithstocks.length == 0) {
        console.log(`User Array is empty`)
        NewUser(user, stock, amount);
    } else {
        if(IsUserAlreadyInArray(stockdata.userswithstocks , user)) {
            console.log(`User is already in array`);
            WriteToStocks(user, stock, amount)
        } else {
            console.log(`User Array is not empty but user is not in it`)
            NewUser(user, stock, amount);
        }
    }
}

function IsUserAlreadyInArray(array, userID){
    console.log(`Checking if ${userID} is in the array`);
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    if (!(array.length == 0)) { // if the length of the Users object array in our original array is not empty
        for (var i = 0, l = array.length; i < l; i++) { // initially i is set to 0, then l is set to the amount of entry's in data.users, and if I is less than L add 1 to I.
            curUser = array[i].id; // get the ID for the current user 
            console.log(curUser);
            if (userID == curUser) { // if the userID we want to check is equal to the curUser in the arrray return true
                console.log(`User ${userID} is already in the array`);
                return true;
            } else { // if we cant find the user in the array return false
                console.log(`User ${userID} is not already in the array`);
                return false;
            }
        }
    } else {
        return false; // return false if the amount of entry's in the Users object array is empty
    }
}   

async function WriteToStocks(user, stock, amount) {
    console.log(`Running Write to Stocks`);
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    console.log(stockdata);
    console.log(user, stock, amount);
    for (var i = 0, l = stockdata.userswithstocks.length; i < l; i++) {
        curUserIndex = i;
        console.log(`Current User Index: ${curUserIndex}`);
        curUser = stockdata.userswithstocks[i];
        console.log(`Current User`);
        console.log(curUser);
        if (curUser.id == user.id) {
            for (y = 0, x = stockdata.stocks.length; y < x; y++) {
                curStockIndex = y;
                console.log(`Current Stock Index: ${curStockIndex}`);
                console.log(`Current Stock`)
                curStock = stockdata.stocks[y];
                console.log(curStock);
                if (curStock.name == stock.name) {
                    newowner = stockdata.userswithstocks[curUserIndex];
                    if (!IsUserAlreadyInArray(curStock.owners, user.id)) {
                        console.log(`Adding New User to array`);
                        addUser = {"name": curUser.name, "id": curUser.id}
                        curStock.owners.push(addUser);
                        console.log(curStock);
                    } 
                    newstock = {"name": stock.name, "price": stock.price, "owners": curStock.owners};
                    console.log(`New Stock`);
                    console.log(newstock);
                    stockdata.stocks.splice(curStockIndex, 1);
                    stockdata.stocks.push(newstock);
                    console.log(`Logging Updated Stock Data`);
                    console.log(stockdata);
                    pglibrary.WriteToJson(stockdata, `./stockmarket.json`);
                    await pglibrary.sleep(500);
                    UpdateUser(user, curUserIndex, stock, amount);
                }
            }
        }
    }

}

async function NewUser(user, stock, amount) {
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    newuser = {"name": user.username, "id": user.id, "PJG": 0, "UNSC": 0, "CVN": 0, "avatar": user.displayAvatarURL};
    stockdata.userswithstocks.push(newuser);
    console.log(stockdata);
    pglibrary.WriteToJson(stockdata, `./stockmarket.json`);
    await pglibrary.sleep(500);
    WriteToStocks(user, stock, amount);
}

async function UpdateUser(user, userindex, stock, amount) {
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    userdata = stockdata.userswithstocks[userindex];
    console.log(userdata);
    if (stock.name == "PJG") {
        console.log(`Stock is PJG`);
        pjgnew = userdata.PJG + amount;
        unscnew = userdata.UNSC;
        cvnnew = userdata.CVN;
    } else if (stock.name == "UNSC") {
        pjgnew = userdata.PJG;
        unscnew = userdata.UNSC + amount;
        cvnnew = userdata.CVN;
    } else if (stock.name == "CVN") {
        pjgnew = userdata.PJG;
        unscnew = userdata.UNSC;
        cvnnew = userdata.CVN + amount;
    }
    updateduser = {"name": user.username, "id": user.id, "PJG": pjgnew, "UNSC": unscnew, "CVN": cvnnew, "avatar": user.displayAvatarURL};
    stockdata.userswithstocks.splice(userindex, 1);
    await pglibrary.sleep(100);
    stockdata.userswithstocks.push(updateduser);
    console.log(stockdata);
    pglibrary.WriteToJson(stockdata, `./stockmarket.json`);
    await pglibrary.sleep(500);
}