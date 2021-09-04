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
        } else if (args[0] == "sell") {
            SellStock(message.author, args, message);
        } else if (args[0] == "list") {
            ListStock(bot, args, message);
        } else {
            message.channel.send(`<@${message.author.id}>, please provide valid arguments of buy/sell/list.`);
        }
    }
}

function BuyStock(user, args, message) {
    console.log(`Buying Stock(s)`);
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    console.log(stockdata);
    stock = FindStock(args[1]);
    console.log(`Found Stock`);
    console.log(stock);
    if (typeof stock !== `undefined`) {
        if (args[2]) {
            args[2] = parseInt(args[2]);
            if (typeof args[2] === `number` && args[2] > 0) {
                console.log(args[2]);
                client.getUserBalance(message.guild.id, user.id).then(econuser => {
                    if ((Math.abs(stock.price) * args[2]) <= econuser.cash) {
                        client.editUserBalance(message.guild.id, user.id, {cash: -Math.abs(stock.price * args[2]), bank: 0});
                        GiveUserStock(user, stock, args[2]);
                        message.channel.send(`<@${message.author.id}>, you have bought ${args[2]} of ${stock.name} for ${stock.price * args[2]} points.`);
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

function SellStock(user, args, message) {
    console.log(`Selling Stock(s)`);
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    console.log(stockdata);
    stock = FindStock(args[1]);
    console.log(`Found Stock`);
    console.log(stock);
    if (typeof stock !== `undefined`) {
        if (args[2]) {
            args[2] = parseInt(args[2]);
            if (typeof args[2] === `number` && args[2] > 0) {
                args[2] = args[2] * - 1;
                console.log(args[2]);
                client.getUserBalance(message.guild.id, user.id).then(econuser => {
                    if (UserHasEnoughStocks(user, stock, args[2])) {
                        client.editUserBalance(message.guild.id, user.id, {cash: stock.price * Math.abs(args[2]), bank: 0});
                        GiveUserStock(user, stock, args[2]);
                        message.channel.send(`<@${message.author.id}>, you have sold ${Math.abs(args[2])} of ${stock.name} for ${stock.price * Math.abs(args[2])} points.`);
                    } else {
                        message.channel.send(`<@${message.author.id}>, you don't have enough stocks for that action.`);
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
        if(IsUserAlreadyInArray(stockdata.userswithstocks , user.id)) {
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
    console.log(array);
    if (!(array.length == 0)) { // if the length of the Users object array in our original array is not empty
        console.log(array.length);
        for (var i = 0, l = array.length; i < l; i++) { // initially i is set to 0, then l is set to the amount of entry's in data.users, and if I is less than L add 1 to I.
            curUser = array[i].id; // get the ID for the current user 
            console.log(curUser);
            if (userID == curUser) { // if the userID we want to check is equal to the curUser in the arrray return true
                console.log(`User ${userID} is already in the array`);
                return true;
            } 
        }
        return false;
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
        var curUser = stockdata.userswithstocks[i];
        var curUserName = curUser.name;
        console.log(curUserName);
        var curUserId = curUser.id;
        console.log(curUserId);
        console.log(`Current User`);
        console.log(curUser);
        if (curUserId == user.id) {
            for (y = 0, x = stockdata.stocks.length; y < x; y++) {
                curStockIndex = y;
                console.log(`Current Stock Index: ${curStockIndex}`);
                console.log(`Current Stock`);
                curStock = stockdata.stocks[y];
                console.log(curStock);
                if (curStock.name == stock.name) {
                    newowner = stockdata.userswithstocks[curUserIndex];
                    if (!IsUserAlreadyInArray(curStock.owners, user.id)) {
                        console.log(`Adding New User to array`);
                        addUser = {"name": curUserName, "id": curUserId, "amount": amount}
                        curStock.owners.push(addUser);
                        console.log(curStock);
                    } else {
                        for (a = 0, b = curStock.owners.length; a < b; a++) {
                            curOwner = curStock.owners[a];
                            if (curOwner.id == user.id) {
                                console.log(`Updating Current User in owners array`);
                                addUser = {"name": curOwner.name, "id": curOwner.id, "amount": curOwner.amount + amount}
                                curStock.owners.splice(a, 1);
                                await pglibrary.sleep(500);
                                curStock.owners.push(addUser);
                                console.log(curStock);
                            }
                        }
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
    usersStock = [];
    for (i = 0, l = stockdata.stocks.length; i < l; i++) {
        console.log(`Current Stock Name for New User: ${stockdata.stocks[i].name}`);
        newStock = {"name": stockdata.stocks[i].name, "amount": 0};
        console.log(`New Stock to add to user`);
        console.log(newStock);
        usersStock.push(newStock);
    }
    console.log(`Logging New Users Stock`);
    console.log(usersStock);
    await pglibrary.sleep(500);
    newuser = {"name": user.username, "id": user.id, "stocks": usersStock, "avatar": user.displayAvatarURL};
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
    console.log(`Requested Stock Data`);
    console.log(stock);
    var stockName = stock.name;
    usersStock = [];
    for (y = 0, x = stockdata.userswithstocks[userindex].stocks.length; y < x; y++) {
        curUserStock = stockdata.userswithstocks[userindex].stocks[y];
        console.log(`Currently Updating stock: ${curUserStock.name}`);
        console.log(curUserStock);
        console.log(`Requested stock name ${stockName}`);
        if (curUserStock.name == stockName) {
            console.log(`Adding to current requested stock`);
            amount = curUserStock.amount + amount;
            console.log(amount);
            var stock = {"name": curUserStock.name, "amount": amount};
            console.log(stock);
            usersStock.push(stock);
        } else {
            console.log(`Current Stock does not match requested stock`);
            var stock = {"name": curUserStock.name, "amount": curUserStock.amount};
            console.log(stock);
            usersStock.push(stock);
        }
    }
    console.log(`Logging Updated User Stocks`);
    console.log(usersStock);
    updateduser = {"name": user.username, "id": user.id, "stocks": usersStock, "avatar": user.displayAvatarURL};
    console.log(`Updated User Array`);
    console.log(updateduser);
    stockdata.userswithstocks.splice(userindex, 1);
    await pglibrary.sleep(100);
    stockdata.userswithstocks.push(updateduser);
    console.log(stockdata);
    pglibrary.WriteToJson(stockdata, `./stockmarket.json`);
    await pglibrary.sleep(500);
}

function UserHasEnoughStocks(user, stock, amount) {
    console.log(`Checking if user ${user.username} has enough stocks`);
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    stockName = stock.name;
    amount =  Math.abs(amount);
    console.log(`Amount to sell: ${amount}`)
    for (i = 0, l = stockdata.userswithstocks.length; i < l; i++) {
        usrIndex = i;
        curUsr = stockdata.userswithstocks[usrIndex];
        console.log(curUsr);
        if (curUsr.id == user.id) {
            for(stockA = 0, stocksIndex = curUsr.stocks.length; stockA < stocksIndex; stockA++ ) {
                curStock = curUsr.stocks[stockA];
                console.log(curStock);
                if(curStock.name == stockName) {
                    if(amount <= curStock.amount && curStock.amount > 0) {
                        console.log(`User has enough stocks`)
                        return true;
                    } else {
                        console.log(`User doesn't have enough stocks.`)
                        return false;
                    }
                }
            }
        }
    }
}

function ListStock(bot, args, message){
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    let embed = new MessageEmbed()
        .setTitle(`Stock Information`)
        .setAuthor(bot.user.username, bot.user.displayAvatarURL)
        .setColor(`#87a9ff`)
        .setDescription("Current Stock Information, Be Mindful this information gets updated Every 5 seconds.")
        .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot");
        stockdata.stocks.forEach(stock => {
            console.log(stock);
            if(stock.owners.length > 0 && IsUserAlreadyInArray(stock.owners, message.author.id)) {
                console.log(stock.owners);
                user = stock.owners.find(({name}) => name === message.author.username);
                console.log(`User to find stock for: ${user.name}`);
                console.log(`The user owns ${user.amount} stock for ${stock.name}`);
                userAmount = user.amount;
            } else {
                userAmount = 0;
            }
            embed.addField(stock.name, `Price: ${stock.price.toString()}, Amount you own: ${userAmount}`);
        });
    message.channel.send({content: `<@${message.author.id}>`, embeds: [embed]});
}

