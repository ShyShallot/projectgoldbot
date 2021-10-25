const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json'); // basic config file read
const { Client } = require('unb-api'); // define our basic client for the UNB-API
const client = new Client(config.econtoken); // define the rest of the client for economy and verify with our econ token
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
// this file handles buying, selling and price check of stocks
module.exports = {
    name: 'stocks',
    description: 'Buy and Sell stocks as they go up and down', 
    args: '1st Args: Buy | Sell, 2nd Args: Stock Name, 3rd Args: Amount to Buy/Sell',
    execute(message, args, bot){
        if (args[0] == "buy") { // basic arg test to decide which function to  run
            console.log(args);
            BuyStock(message.author, args, message);
        } else if (args[0] == "sell") {
            SellStock(message.author, args, message);
        } else if (args[0] == "list") { // will be become useless with the launch of the MsSQL db.
            ListStock(bot, args, message);
        } else {
            message.channel.send(`<@${message.author.id}>, please provide valid arguments of buy/sell/list.`); // message sent if we dont accept any argument given
        }
    }
}

function BuyStock(user, args, message) {
    console.log(`Buying Stock(s)`);
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8'); // pause everthing and read the contents of stockmarket.json to a var
    stockdata = JSON.parse(stockfile); // parse the data into a JS array
    console.log(stockdata);
    stock = FindStock(args[1]); // get the stock data based off the name of the argument.
    console.log(`Found Stock`);
    console.log(stock);
    if (typeof stock !== `undefined`) { // check if the stock var has something valid defined to it
        if (args[2]) { // if we have a 3rd argument
            args[2] = parseInt(args[2]); // turn the 3rd argument into a int
            if (typeof args[2] === `number` && args[2] > 0) { // check if our 3rd argument is a number and is above 0.
                if (MaxUserStocks(user.id)) { // check if the user has the maximum amount of stocks.
                    message.channel.send(`<@${user.id}>, you own the max amount stocks, purchase did not go through`);
                    return; // stop all function if they do.
                }
                if (GrabUserInfo(user.id, stock)) { // check if user exists as a owner for the given stock
                    curUser = GrabUserInfo(user.id, stock); // GrabUserInfo returns valid define it to a var
                    if (args[2] + curUser.amount > stockdata.maxownedstocks) { // if the requested amount plus the amount they already have is greater than the limit.
                        message.channel.send(`<@${user.id}>, The entered amount of stocks (${args[2]}) along with your currently owned stocks (${curUser.amount}) will go over the allowed amount of owned stocks which is ${stockdata.maxownedstocks}.`);
                        return; 
                    }
                } else if (args[2] > stockdata.maxownedstocks) { // check if the requested amount is greater than the max amount.
                    message.channel.send(`<@${user.id}>, you cannot buy over the max allowed amount of stocks which is ${stockdata.maxownedstocks}.`);
                    return;
                }
                client.getUserBalance(message.guild.id, user.id).then(econuser => { // get the users balance.
                    if (stock.price * args[2] <= econuser.cash) { // check if the user has enough money for the amount of stocks they want to buy.
                        var stockprice = stock.price; // define the stock price to a var to prevent some wacky issues.
                        console.log(stockprice);
                        var finalprice = stockprice * args[2]; // calculate the final price and define it to a var.
                        console.log(finalprice);
                        if (stockprice <= 500) { 
                            console.log(`Stock is under are required amount`);
                            message.channel.send(`<@${user.id}>, stock ${stock.name} is under the minimum buy allowed cost. Stock Price: ${stock.price}.`);
                            return;
                        } else if (stockprice > 0) {
                            client.editUserBalance(message.guild.id, user.id, {cash: -finalprice, bank: 0});
                        } 
                        WriteToStocks(user, stock, args[2]); // run our function to add the user and the requested amount of stock to our stockmarket.json.
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

function SellStock(user, args, message) { // this function runs similar to our BuyStocks but does some minor math stuff to remove the amount of stocks.
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
                    console.log(UserHasEnoughStocks(user.id, stock, args[2]));
                    if (UserHasEnoughStocks(user.id, stock, args[2])) { // run our function to check if the user has enough stocks to sell in the first place.
                        console.log(`User has enough stocks continuing`);
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
                        console.log(`User doesn't have enough stocks to sell.`);
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

function FindStock(requestedstock) { // return a stock array from a name
    if (typeof requestedstock === `undefined`) {
        console.log(`No Stock defined`);
        return;
    }
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8'); // make sure our stockdata is up to date.
    stockdata = JSON.parse(stockfile); 
    for (i = 0, l = stockdata.stocks.length; i < l; i++) {
        stock = stockdata.stocks[i];
        console.log(`Current Stock: ${stock.name}`);
        console.log(stock);
        stockname = stock.name;
        console.log(stockname);
        if(requestedstock == stockname) { // if the requestedstock name is equal to the current stock name.
            return stock;
        } 
    }
}


function IsUserAlreadyInArray(array, userID){ // check if the user already exists in the given array.
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

async function WriteToStocks(user, stock, amount) { // our main function to write user data to the stockmarket.json file.
    console.log(`Running Write to Stocks`);
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    console.log(stockdata);
    console.log(user, stock, amount);
    for (y = 0, x = stockdata.stocks.length; y < x; y++) { // for every stock in the stockdata.stocks array
        curStockIndex = y; 
        console.log(`Current Stock Index: ${curStockIndex}`);
        console.log(`Current Stock`);
        curStock = stockdata.stocks[y];
        console.log(curStock);
        if (curStock.name == stock.name) { // if the current stock name is equal to the given stock name 
            if (!IsUserAlreadyInArray(curStock.owners, user.id)) { // if the user isnt already in the current stock owners array. no need to check if the array is empty as the function handles this.
                console.log(`Adding New User to array`);
                addUser = {"name": user.username, "id": user.id, "amount": amount} // user data to add to the current stock owners array.
                curStock.owners.push(addUser);
                console.log(curStock);
            } else { // else if the user is already in the array.
                for (a = 0, b = curStock.owners.length; a < b; a++) { // for every unique owner in the current stock's owner array.
                    curOwner = curStock.owners[a]; // get the current owner based off index.
                    if (curOwner.id == user.id) { // if the current owner is equal to the given user ID
                        console.log(`Updating Current User in owners array`);
                        if(curOwner.amount + amount < 0) { // if the amount goes below 0 
                            amount = 0; // set it to 0
                        }
                        addUser = {"name": curOwner.name, "id": curOwner.id, "amount": curOwner.amount + amount} // user data to add to the owners array.
                        curStock.owners.splice(a, 1); // remove the user from the owners array based off the current index from our A var.
                        await pglibrary.sleep(500); // give some time for the removal to finish
                        curStock.owners.push(addUser); // add the user back to array 
                        console.log(curStock);
                    }
                }
            }
            newstock = {"name": stock.name, "price": stock.price, "owners": curStock.owners}; // update our stock information.
            console.log(`New Stock`);
            console.log(newstock);
            stockdata.stocks.splice(curStockIndex, 1); // remove the stock from the stocks array based off the current index.
            await pglibrary.sleep(500);
            stockdata.stocks.push(newstock); // add it back to the array.
            console.log(`Logging Updated Stock Data`);
            console.log(stockdata);
            pglibrary.WriteToJson(stockdata, `./stockmarket.json`); // write to the json file with the updated stockdata info.
            await pglibrary.sleep(500); // kinda unnesscary as the WriteToJson uses writeFileSync anyways. but whatever.
            return; // stop any thing else from running.
        }
    }
}

function UserHasEnoughStocks(userID, stock, amount) { // stock should only be a stock array.
    console.log(`Checking if user ${userID} has enough stocks`);
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    stockName = stock.name;
    console.log(`Amount to sell: ${amount}`);
    for(uI = 0, uL = stock.owners.length; uI < uL; uI++){
        owner = stock.owners[uI];
        console.log(owner);
        if (owner.id == userID) { // check if our current owner.id is equal to the give User Id
            console.log(`Stock owner id is equal to given userid`);
            console.log(owner.amount);
            if (amount <= owner.amount){ // the request amount is less than or equal to the owner amount.
                console.log(`User has enough stocks`);
                return true; 
            } else {
                console.log('User does not have enough stocks')
                return false;
            }
        }
    };
}


function ListStock(bot, args, message){
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    let embed = new MessageEmbed()
        .setTitle(`Stock Information`)
        .setAuthor(bot.user.username, bot.user.displayAvatarURL)
        .setColor(`#87a9ff`)
        .setDescription(`Current Stock Information, Be Mindful this information gets updated every ${stockdata.updateinterval} hour(s).`)
        .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot")
        .addField(`Stock Price Website`, "https://www.projectgold.dev/stocks/")
        stockdata.stocks.forEach(stock => {
            console.log(stock);
            if(stock.owners.length > 0 && IsUserAlreadyInArray(stock.owners, message.author.id)) {
                console.log(stock.owners);
                user = stock.owners.find(({id}) => id === message.author.id);
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

function GrabUserInfo(userID, stock) { // function for grabbing a users stock information from ID
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    if(stock.owners.length <= 0) { // if the stocks owners array is less than or equal to 0
        return false; // return false
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
    for (i = 0, l = stockdata.stocks.length; i < l; i++) { // for every stock in stockdata.stocks
        curStock = stockdata.stocks[i];
        curStock.owners.forEach(owner => { // for every owner in the current stock owners array
            console.log(owner);
            if (owner.id == userID) { // if the owner id is equal to the given userID
                ownedStocks += owner.amount; // add the ownedStocks var our owner.amount plus the original ownedStocks amount value
                console.log(ownedStocks);
            }
        });
    }
    console.log(`Total Owned Stocks: ${ownedStocks}`);
    if (ownedStocks >= stockdata.maxownedstocks) { // if the ownedStocks stocks var is over the stockdata.maxownedstocks value.
        return true; // return true saying the user has the max amount of stocks
    } else {
        return false; // return false saying the user does not have the max amount of stocks.
    }
}
