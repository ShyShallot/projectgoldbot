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
                if (MaxUserStocks(user.id)) {
                    message.channel.send(`<@${user.id}>, you own the max amount stocks, purchase did not go through`);
                    return;
                }
                if (GrabUserInfo(user.id, stock)) {
                    curUser = GrabUserInfo(user.id, stock);
                    if (args[2] + curUser.amount > stockdata.maxownedstocks) {
                        message.channel.send(`<@${user.id}>, The entered amount of stocks (${args[2]}) along with your currently owned stocks (${curUser.amount}) will go over the allowed amount of owned stocks which is ${stockdata.maxownedstocks}.`);
                        return;
                    }
                } else if (args[2] > stockdata.maxownedstocks) {
                    message.channel.send(`<@${user.id}>, you cannot buy over the max allowed amount of stocks which is ${stockdata.maxownedstocks}.`);
                    return;
                }
                client.getUserBalance(message.guild.id, user.id).then(econuser => {
                    if (stock.price * args[2] <= econuser.cash) {
                        var stockprice = stock.price;
                        console.log(stockprice);
                        var finalprice = stockprice * args[2];
                        console.log(finalprice);
                        if (stockprice <= 0 ) {
                            console.log(`Points to remove is 0, continuing`);
                        } else {
                            client.editUserBalance(message.guild.id, user.id, {cash: finalprice, bank: 0});
                        }
                        WriteToStocks(user, stock, args[2]);
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
                if (args[2] < 0) {
                    args[2] = Math.abs(args[2]);
                }
                negativeAmount = args[2] * - 1;
                console.log(args[2]);
                console.log(negativeAmount)
                client.getUserBalance(message.guild.id, user.id).then(econuser => {
                    if (UserHasEnoughStocks(user, stock, args[2])) {
                        var stockprice = stock.price;
                        console.log(stockprice);
                        var finalprice = stockprice * args[2];
                        console.log(finalprice);
                        if (stockprice <= 0 ) {
                            console.log(`Points to give is 0, continuing`);
                        } else {
                            client.editUserBalance(message.guild.id, user.id, {cash: finalprice, bank: 0});
                        }
                        WriteToStocks(user, stock, negativeAmount);
                        message.channel.send(`<@${message.author.id}>, you have sold ${args[2]} of ${stock.name} for ${stock.price * args[2]} points.`);
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
    for (y = 0, x = stockdata.stocks.length; y < x; y++) {
        curStockIndex = y;
        console.log(`Current Stock Index: ${curStockIndex}`);
        console.log(`Current Stock`);
        curStock = stockdata.stocks[y];
        console.log(curStock);
        if (curStock.name == stock.name) {
            if (!IsUserAlreadyInArray(curStock.owners, user.id)) {
                console.log(`Adding New User to array`);
                addUser = {"name": user.username, "id": user.id, "amount": amount}
                curStock.owners.push(addUser);
                console.log(curStock);
            } else {
                for (a = 0, b = curStock.owners.length; a < b; a++) {
                    curOwner = curStock.owners[a];
                    if (curOwner.id == user.id) {
                        console.log(`Updating Current User in owners array`);
                        if(curOwner.amount + amount < 0) {
                            amount = 0;
                        }
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
            return;
        }
    }
}

function UserHasEnoughStocks(user, stock, amount) {
    console.log(`Checking if user ${user.username} has enough stocks`);
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    stockName = stock.name;
    amount =  Math.abs(amount);
    console.log(`Amount to sell: ${amount}`)
    for (i = 0, l = stocksdata.stocks.length; i < l; i++) {
        curStock = stockdata.stocks[i];
        if (curStock.name == stock.name) {
            console.log(`Requested Stock is equal to the current stock`)
            curStock.owners.forEach(owner => {
                console.log(owner);
                if (owner.id == userID) {
                    console.log(`Stock owner id is equal to given userid`);
                    if (amount <= owner.amount){
                        console.log(`User has enough stocks`);
                        return true;
                    }
                }
            });
        }
    }
    return false;
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

function GrabUserInfo(userID, stock) {
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    if(stock.owners.length <= 0) {
        return false;
    }
    for(i = 0, l = stock.owners.length; i < l; i++) {
        curStockOwner = stock.owners[i];
        curSOID = curStockOwner.id;
        if (curSOID == userID) {
            return true, curStockOwner;
        }
    }

}

function MaxUserStocks(userID) {
    console.log(`Checking if User has maximum stocks`);
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    ownedStocks = 0;
    for (i = 0, l = stockdata.stocks.length; i < l; i++) {
        curStock = stockdata.stocks[i];
        curStock.owners.forEach(owner => {
            console.log(owner);
            if (owner.id == userID) {
                ownedStocks += owner.amount;
                console.log(ownedStocks);
            }
        });
    }
    console.log(`Total Owned Stocks: ${ownedStocks}`);
    if (ownedStocks >= stockdata.maxownedstocks) {
        return true;
    } else {
        return false;
    }
}