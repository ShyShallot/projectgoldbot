const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json'); // basic config file read
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
const points_manager = require('../points/manager');
const masterdb = require('../master-db/masterdb');
const { arg, string } = require('mathjs');
// this file handles buying, selling and price check of stocks
module.exports = {
    name: 'stocks',
    description: 'Buy and Sell stocks as they go up and down', 
    args: '1st Args: Buy | Sell, 2nd Args: Stock Name, 3rd Args: Amount to Buy/Sell',
    active: false,
    econ: true,
    async execute(message, args, bot){
        console.log(args);
        guildConfig = await masterdb.getGuildJson(message.guild.id,"config");
        if (args[0] == "server-prefix" && message.member.roles.cache.find(role => role.name === guildConfig.modrole) && args[1]){
            await SetServerStockPrefix(message.guild.id,message,args).then((status) => {
                message.channel.send(`<@${message.author.id}>, Successfully Set Server Stock Prefix to ${args[1]}`);
                return;
            });
            return;
        }
        if (args[0] == "buy" || args[0] == "sell") { // basic arg test to decide which function to  run
            StockHandler(message,args)
        } else if (args[0] == "list") { // will be become useless with the launch of the MsSQL db.
            ListStock(bot, args, message);
        } else if (typeof args[0] === 'undefined'){
          ListStock(bot, args, message);  
        } else {
            message.channel.send(`<@${message.author.id}>, please provide valid arguments of buy/sell/list.`); // message sent if we dont accept any argument given
        }
    }
}

async function StockHandler(message, args) {
    console.log(`Buying Stock(s)`);
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8'); // pause everthing and read the contents of stockmarket.json to a var
    stockdata = JSON.parse(stockfile); // parse the data into a JS array
    console.log(stockdata);
    [stock,stockIndex] = FindStock(args[1]); // get the stock data based off the name of the argument.
    console.log(`Found Stock`);
    console.log(stock);
    user = message.author;
    if (typeof stock !== `undefined`) { // check if the stock var has something valid defined to it
        if (args[2]) { // if we have a 3rd argument
            if ( args[2] == "all" || args[2] == "half" || typeof parseInt(args[2]) === 'number' && parseInt(args[2]) > 0) { // check if our 3rd argument is a number and is above 0.
                curUser = GrabUserInfo(user.id, stock,stockIndex);
                if(args[0] == "buy"){
                    if(args[2] == "all" || args[2] == 'half'){return};
                    amount = parseInt(args[2]);
                    if(isNaN(amount)){return;}
                    if (MaxUserStocks(user.id)) { // check if the user has the maximum amount of stocks.
                        message.channel.send(`<@${user.id}>, you own the max amount stocks, purchase did not go through`);
                        return; // stop all function if they do.
                    }
                    if (args[2] + curUser.amount > stockdata.maxownedstocks) { // if the requested amount plus the amount they already have is greater than the limit.
                        message.channel.send(`<@${user.id}>, The entered amount of stocks (${args[2]}) along with your currently owned stocks (${curUser.amount}) will go over the allowed amount of owned stocks which is ${stockdata.maxownedstocks}.`);
                        return; 
                    } 
                    if(typeof curUser === undefined && args[2] > stockdata.maxownedstocks){
                        message.channel.send(`<@${user.id}>, you cannot buy over the max allowed amount of stocks which is ${stockdata.maxownedstocks}.`);
                        return;
                    }
                    [cash,bank] = await points_manager.getUserBalance(user.id,message.guild.id);
                    stockPrice = stock.value[stock.value.length-1];
                    if (stockPrice * args[2] <= cash) { // check if the user has enough money for the amount of stocks they want to buy.
                        console.log(stockprice);
                        var finalprice = stockprice * args[2]; // calculate the final price and define it to a var.
                        console.log(finalprice);
                        if (stockprice <= 500) { 
                            console.log(`Stock is under the required amount`);
                            message.channel.send(`<@${user.id}>, stock ${stock.name} is under the minimum buy allowed cost. Stock Price: ${stockPrice}.`);
                            return;
                        } else if (stockprice >= 500) {
                            points_manager.giveUserPoints(user.id, -stockprice,'cash',true,message.guild.id);
                        } 
                        console.log(stock);
                        WriteToStocks(user, stock, stockIndex, amount); // run our function to add the user and the requested amount of stock to our stockmarket.json.
                        message.channel.send(`<@${message.author.id}>, you have bought ${args[2]} of ${stock.name} for ${stockPrice * args[2]} points.`);
                    } else {
                        message.channel.send(`<@${message.author.id}>, you don't have enough money for that action.`);
                    }
                } else{ // since we already check our first argument we dont need an if else
                    curUser = GrabUserInfo(user.id, stock); // GrabUserInfo returns valid define it to a var
                    for(i = 0; i < stock.owners.length; i++){
                        if(stock.owners[i].id == user.id){
                            if(args[2] == "all"){
                                if(stock.owners[i].amount > 0){
                                    args[2] = stock.owners[i].amount;
                                } else{
                                    message.channel.send(`<@${message.author.id}>, You Don't have enough stocks`);
                                    return;
                                }
                            } else if (args[2] == "half"){
                                if(stock.owners[i].amount > 1){
                                    args[2] = Math.round(stock.owners[i].amount / 2);
                                } else {
                                    message.channel.send(`<@${message.author.id}>, You Don't have enough stocks for half`);
                                    return;
                                }
                            }
                        }
                    }
                    negativeAmount = args[2]*-1;
                    if(UserHasEnoughStocks(user.id,stock,args[2])){
                        let stockprice = stock.value[stock.value.length-1];
                        let finalprice = stockprice*args[2];
                        if(stockprice > 0){
                            points_manager.giveUserPoints(user.id,finalprice,'cash',true,message.guild.id);
                        }
                        console.log(stock);
                        WriteToStocks(user,stock, stockIndex ,negativeAmount);
                        message.channel.send(`<@${message.author.id}>, you have sold ${args[2]} of ${stock.name} for ${finalprice} points.`);
                    }
                }
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
    for (i=0; i < stockdata.stocks.length; i++) {
        stock = stockdata.stocks[i];
        console.log(`Current Stock: ${stock.name}`);
        console.log(stock);
        stockname = stock.name;
        console.log(stockname);
        if(requestedstock == stockname) { // if the requestedstock name is equal to the current stock name.
            return [stock,i];
        } 
    }
}


function IsUserAlreadyInArray(array, userID){ // check if the user already exists in the given array.
    //console.log(`Checking if ${userID} is in the array`);
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    //console.log(array);
    if (!(array.length == 0)) { // if the length of the Users object array in our original array is not empty
        //console.log(array.length);
        for (var i = 0, l = array.length; i < l; i++) { // initially i is set to 0, then l is set to the amount of entry's in data.users, and if I is less than L add 1 to I.
            curUser = array[i].id; // get the ID for the current user 
            //console.log(curUser);
            if (userID == curUser) { // if the userID we want to check is equal to the curUser in the arrray return true
                //console.log(`User ${userID} is already in the array`);
                return true;
            } 
        }
        return false;
    } else {
        return false; // return false if the amount of entry's in the Users object array is empty
    }
}   

async function WriteToStocks(user, stock, stockIndex, amount) { // our main function to write user data to the stockmarket.json file.
    console.log(`Running Write to Stocks`);
    stockdata = JSON.parse(fs.readFileSync(`./stockmarket.json`, 'utf-8'));
    if (!IsUserAlreadyInArray(stock.owners, user.id)) { // if the user isnt already in the current stock owners array. no need to check if the array is empty as the function handles this.
        console.log(`Adding New User to array`);
        addUser = {"name": user.username, "id": user.id, "amount": amount} // user data to add to the current stock owners array.
        stock.owners.push(addUser);
        console.log(stock);
    } else { // else if the user is already in the array.
        for (i = 0; i < stock.owners.length; i++) { // for every unique owner in the current stock's owner array.
            curOwner = stock.owners[i]; // get the current owner based off index.
            if (!curOwner.id == user.id) {return}; // if the current owner is equal to the given user ID
            console.log(`Updating Current User in owners array`);
            if(curOwner.amount + amount < 0) { // if the amount goes below 0 
                amount = 0; // set it to 0
            }
            curValue = stock.value[stock.value.length-1];
            stock.owners[i].amount += amount;
            curValue -= amount*(Math.random()*StocksAround(stock));
            stock.value.push(curValue);
        }
    }
    stockdata.stocks[stockIndex] = stock;
    console.log(`Logging Updated Stock Data`);
    console.log(stockdata);
    await pglibrary.WriteToJson(stockmarket, './stockmarket.json').then((status) => {console.log(status)});
    return; // stop any thing else from running.
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
    stockdata = JSON.parse(fs.readFileSync(`./stockmarket.json`, 'utf-8'));
    if(args[1]){
        stockFN = stockdata.stocks.find(stk => stk.name.toLowerCase() === args[1].toLowerCase());
        if(typeof stockFN === 'undefined'){return;}
        let embed = new MessageEmbed()
            .setTitle(`Stock ${stockFN.name} Info`)
            .setAuthor(bot.user.username, bot.user.displayAvatarURL())
            .setColor(`#87a9ff`)
            .addField(`Current Stock Price`, `$${stockFN.value[stockFN.value.length-1]}`);
        stockString = ``;
        back = stockFN.value.length-6;
        if(stockFN.value.length <= 5){
            back = 0;
        }
        console.log(back);
        for(i=back;i<stockFN.value.length;i++){
            console.log(stockFN.value[i]);
            stockString += `$${stockFN.value[i]}, `;
        }
        stockString = stockString.substring(0, stockString.length - 2);
        embed.addField(`Stock History`, stockString);
        message.channel.send({content: `<@${message.author.id}>`, embeds: [embed]});
        return;        
    };
    let embed = new MessageEmbed()
        .setTitle(`Stock Information`)
        .setAuthor(bot.user.username, bot.user.displayAvatarURL())
        .setColor(`#87a9ff`)
        .setDescription(`Current Stock Information, Be Mindful this information gets updated every ${stockdata.updateinterval} hour(s).`)
        .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot")
        .addField(`Stock Price Website`, "https://www.projectgold.dev/stocks/")
        stockdata.stocks.forEach(stock => {
            console.log(stock);
            if(stock.owners.length > 0 && IsUserAlreadyInArray(stock.owners, message.author.id)) {
                //console.log(stock.owners);
                user = stock.owners.find(({id}) => id === message.author.id);
                //console.log(`User to find stock for: ${user.name}`);
                //console.log(`The user owns ${user.amount} stock for ${stock.name}`);
                userAmount = user.amount;
            } else {
                userAmount = 0;
            }
            embed.addField(stock.name, `Price: ${stock.value[stock.value.length-1].toString()}, Amount you own: ${userAmount}`);
        });
    message.channel.send({content: `<@${message.author.id}>`, embeds: [embed]});
}

function GrabUserInfo(userID, stock) { // function for grabbing a users stock information from ID
    stockfile = fs.readFileSync(`./stockmarket.json`, 'utf-8');
    stockdata = JSON.parse(stockfile);
    if(stock.owners.length <= 0) { // if the stocks owners array is less than or equal to 0
        return false; // return false
    }
    for(i = 0; i <stock.owners.length; i++) {
        curStockOwner = stock.owners[i];
        curSOID = curStockOwner.id;
        if (curSOID == userID) {
            return curStockOwner;
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

async function SetServerStockPrefix(guildId,message,args){
    guildConfig = await masterdb.getGuildJson(guildId,"config");
    guildConfig.stockname = args[1];
    await masterdb.writeGuildJsonFile(guildId,"config",guildConfig);
    return Promise.resolve("Done");
}

function StocksAround(stock){
    ownedStocks = 0;
    for(i=0;i<stock.owners.length;i++){
        ownedStocks += stock.owners[i].amount;
    }
    return ownedStocks;
}
