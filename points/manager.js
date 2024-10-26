const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json'); // basic config file read
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
const path = require('path');
const os = require('os');
const masterdb = require('../master-db/masterdb');
var manager = module.exports = {
    bot: null,
    setBot: function(bot){ // funky work around 
        manager.bot = bot;
    },
    getBot(){ // trying to access the var directly has some weird issues sometimes
        return this.bot;
    },
    giveUserPoints: async function(id, amount, location,taxFree, guildId){
        console.log(guildId);
        let user = await masterdb.getUser(guildId,id)

        let dB = await masterdb.getGuildConfig(guildId)

        if(user === undefined){
            return
        }
    
        let new_amount = 0
        if(location == "bank"){
            let base_bank_balance = user.balance_bank
            if(taxFree){
                new_amount = (amount * dB.points_multi); // multiply our inital amount
                new_amount = Math.round(new_amount*100)/100; // weird way to round so that we keep the last 2 decimals
            } else {
                new_amount = ((amount - pglibrary.percentage(amount, dB.pointsTax)) * dB.points_multi);
                new_amount = Math.round(new_amount*100)/100;
            }
            let finalAmount = new_amount+base_bank_balance
            await masterdb.editUserValue(guildId,id,"balance_bank",finalAmount)
        } else if(location == "cash"){
            let base_cash_balance = user.balance_cash
            if(taxFree){
                new_amount = (amount * dB.points_multi);
                new_amount = Math.round(new_amount*100)/100;
            } else {
                new_amount = ((amount - pglibrary.percentage(amount, dB.pointsTax)) * dB.points_multi);
                console.log(new_amount)
                new_amount = Math.round(new_amount*100)/100;
            }
            let finalAmount = new_amount+base_cash_balance
            console.log(new_amount, base_cash_balance)
            console.log(finalAmount)
            await masterdb.editUserValue(guildId,id,"balance_cash",finalAmount)
        } else {
            console.error('Invalid Points Location Provided');
            return;
        }
        return Promise.resolve(`Gave User: ${id} ${amount} points`);
        //pglibrary.EconChannelLog(`User ${id} has been given/removed ${pglibrary.commafy(amount)} points`, 'Command', this.bot);
    },
    setUserPoints: async function(id, points, location,guildId){
        let user = await masterdb.getUser(guildId,id)
        if(location == "bank"){
            user.balance_bank += points;
            await masterdb.editUserValue(guildId,id,"balance_cash",user.balance_bank)
        } else if(location == "cash"){
            user.balance_cash += points;
            await masterdb.editUserValue(guildId,id,"balance_cash",user.balance_cash)
        } else {
            err = "Invalid Location";
            return err;
        }
        //pglibrary.EconChannelLog(`User ${id} points have been set to ${pglibrary.commafy(points)}.`, `Admin Command`, this.bot);
    },
    async donatePoints(patronId, targetID, amount,location,guildId){
        let patron = await masterdb.getUser(guildId,patronId)
        let target = await masterdb.getUser(guildId,targetID)
        if(location == "bank"){
            if(patron.balance_bank < amount){
                return "You do not have enough points!";
            }
            patron.balance_bank -= amount;
            target.balance_bank += amount;
            await masterdb.editUserValue(guildId,patronId,"balance_bank",patron.balance_bank)
            await masterdb.editUserValue(guildId,targetID,"balance_bank",patron.balance_bank)
        } else if(location == "cash"){
            if(patron.balance_cash < amount){
                return "You do not have enough points!";
            }
            patron.balance_cash -= amount;
            target.balance_cash += amount;
            await masterdb.editUserValue(guildId,patronId,"balance_cash",patron.balance_cash)
            await masterdb.editUserValue(guildId,targetID,"balance_cash",patron.balance_cash)
        } else {
            err = "Invalid Location";
            return err;
        }
        
        //pglibrary.EconChannelLog(`User ${patronId} has given ${targetID} ${pglibrary.commafy(amount)} points.`, `Command`, this.bot);
    },
    async messagePoints(id,guildId){
        await this.giveUserPoints(id,10,"cash",false,guildId);
    },
    async getUserBalance(id, guildId){
        user = await masterdb.getUser(guildId,id)
        return [user.balance_bank, user.balance_cash]
    },
    async getServerStats(guildId){
        startTime = Date.now();
        let users = await masterdb.getAllUsers(guildId)
        let bank = 0;
        let cash = 0;
        users.forEach(user =>{
            bank += user.balance_bank;
            cash += user.balance_cash;
        });
        total = cash+bank;
        console.log(total);
        console.log(`Time to Complete: ${Date.now() - startTime}ms`);
        return [cash,bank,total];
    },
    async depositPoints(id,amount,guildId){
        user = await masterdb.getUser(guildId,id)
        if(amount <= user.balance_cash){
            user.balance_cash -= amount;
            user.balance_bank += Math.round(amount);
            await masterdb.editUserValue(guildId,id,"balance_cash",user.balance_cash)
            await masterdb.editUserValue(guildId,id,"balance_cash",user.balance_bank)
        } else {
            err = "Not Enough Points to Deposit";
            return err;
        }
        //pglibrary.EconChannelLog(`User ${id} has deposited ${pglibrary.commafy(amount)} points`, `Command`, this.bot);
    },
    async withdrawPoints(id,amount, guildId){
        user = await masterdb.getUser(guildId,id)
        if(amount <= user.balance_bank){
            user.balance_cash += amount;
            user.balance_bank -= Math.round(amount);
            await masterdb.editUserValue(guildId,id,"balance_cash",user.balance_cash)
            await masterdb.editUserValue(guildId,id,"balance_cash",user.balance_bank)
        } else {
            err = "Not Enough Points to Deposit";
            return err;
        }
        //pglibrary.EconChannelLog(`User ${id} has Withdrew ${pglibrary.commafy(amount)} points`, `Command`, this.bot);
    },
    async sortForLeaderboard(guildId){
        users = await masterdb.getAllUsers(guildId)
        allTotalArray = [];
        startTime = Date.now();
        users.forEach(user => {
            total = user.balance_cash + user.balance_bank;
            leaderUser = {"username": user.username, "total":total};
            allTotalArray.push(leaderUser);
        });
        finalArray = allTotalArray.sort(function(a,b) {
            return b.total-a.total;
        });
        console.log(`Took ${Date.now()-startTime}ms`)
        return finalArray;
    },
    async giveUserItem(id, item,amount, guildId){
        let user = await masterdb.getUser(guildId,id)
        if(amount){
            if(amount >= 2){
                for(i=0;i<amount;i++){
                    user.inv.push(item);
                }
            } else {
                user.inv.push(item);
            }
        } else {
            user.inv.push(item);
        }
        await masterdb.editUserValue(guildId,id,"inv",user.inv)
    },
    async useItem(id, item, message,guildId){
        let user = await masterdb.getUser(guildId,id)
        if(user.inv.length <= 0){
            return Promise.reject('Your Inventory is Empty!');
        }
        for(i=0;i<user.inv.length;i++){
            if(user.inv[i].name == item.name){
                user.inv.splice(i, 1);
                await masterdb.editUserValue(guildId,id,"inv", user.inv)
            } else {
                return Promise.reject(`Your Inventory Does not contain ${item.name}`);
            }
        }
        switch(item.type){
            case 'role':
                roleId = item.typeParam.replace(/[^0-9\.]+/g,"");
                let guild = message.guild;
                let userList = await guild.members.fetch().then(members =>{ // since the cache doesnt get EVERY user we manually ask for each user in the server
                    members.forEach(member => {
                        if(member.id == id){
                            let role = guild.roles.cache.find(r => r.id === roleId);
                            console.log(role);
                            if(typeof role !== 'object'){
                                console.error(`Could Not Find Role: ${roleId}`);
                                rej('Could Not Find Role associated with this Item, if you not an Admin please let this be known.');
                                return;
                            }
                            member.roles.add(role);
                            return Promise.resolve('done');
                        }
                    });
                });
            case 'points':
                user.balance_cash += item.typeParam;
                await masterdb.editUserValue(guild,id,"balance_cash",user.balance_cash)
                return Promise.resolve('done');
        }
    },
    async work(id,amount,guildId){
        let user = await masterdb.getUser(guildId,id)
        let dB = await masterdb.getGuildConfig(guildId)
        if(user.work_cooldown){
            return;
        }
        user.balance_cash += ((amount - pglibrary.percentage(amount, dB.pointsTax)) * dB.points_multi);
        user.balance_cash = Math.round(user.balance_cash*100)/100; // round to the hundredths place
        user.work_cooldown = 1;
        user.set_on_cooldown = Date.now();
        console.log(id)
        await masterdb.editUserValue(guildId,id,"balance_cash",user.balance_cash)
        await masterdb.editUserValue(guildId,id,"set_on_cooldown",user.set_on_cooldown)
        await masterdb.editUserValue(guildId,id,"work_cooldown",user.work_cooldown)
        setTimeout(()=> this.removeWorkCooldown(id), dB.work_cooldown_time);
        //pglibrary.EconChannelLog(`User ${id} has worked and earned ${pglibrary.commafy(amount)} points`, `Command`, this.bot);
    },
    async crime(id,amount,guildId){
        let user = await masterdb.getUser(guildId,id)
        let dB = await masterdb.getGuildConfig(guildId)
        if(user.crime_cooldown == 1){
            return;
        }
        user.balance_cash += (amount * dB.points_multi);
        user.balance_cash = Math.round(user.balance_cash*100)/100; // round to the hundredths place
        user.crime_cooldown = 1;
        user.last_crime = Date.now();
        await masterdb.editUserValue(guildId,id,"balance_cash",user.balance_cash)
        await masterdb.editUserValue(guildId,id,"last_crime",user.last_crime)
        await masterdb.editUserValue(guildId,id,"crime_cooldown",user.crime_cooldown)
        setTimeout(()=> this.removeCrimeCooldown(id), dB.crime_cooldown_time);
        //pglibrary.EconChannelLog(`User ${id} has committed a crime and earned ${pglibrary.commafy(amount)} points`, `Command`, this.bot);
    },
    async removeWorkCooldown(id,guildId){
        await masterdb.editUserValue(guildId,id,"work_cooldown",0)
        //pglibrary.EconChannelLog(`Removed Work Cooldown for user ${id}`, `Automated Timer`, this.bot);
    },
    async removeCrimeCooldown(id,guildId){
        await masterdb.editUserValue(guildId,id,"crime_cooldown",0)
        //pglibrary.EconChannelLog(`Removed Crime Cooldown for user ${id}`, `Automated Timer`, this.bot);
    },
    async setEconSymbol(input,guildId){
        await masterdb.editGuildValue(guildId,"econ_symbol",input)
    },
    async checkPausedTimers(guildId){ // a function used so that if the bot restarts cooldowns using the setTimeout are taken care of as they are cleared on restart

        let users = await masterdb.getAllUsers(guildId)
        let dB = await masterdb.getGuildConfig(guildId)
        for(i=0;i<users.length;i++){
            if(users[i].work_cooldown && typeof users[i].set_on_cooldown !== 'undefined'){
                if(Date.now() >= users[i].set_on_cooldown + dB.work_cooldown_time){
                    await masterdb.editUserValue(guildId,users[i].user_id,"work_cooldown",0)
                    await masterdb.editUserValue(guildId,users[i].user_id,"set_on_cooldown",0)
                }
            }
            if(users[i].crime_cooldown && typeof users[i].last_crime !== 'undefined'){
                if(Date.now() >= users[i].last_crime + dB.crime_cooldown_time){
                    await masterdb.editUserValue(guildId,users[i].user_id,"crime_cooldown",0)
                    await masterdb.editUserValue(guildId,users[i].user_id,"last_crime",0)
                }
            }
        }
    },
    async symbol(guildId){ // read only thing
        return await masterdb.getGuildConfig(guildId).econ_symbol
    },
    async fetchItem(name,bool,guildId){
        if(!name){
            err = "Not Name Provided";
            return err;
        }
        let dB = await masterdb.getGuildConfig(guildId)
        for(i=0;i<dB.items.length;i++){
            if(dB.items[i].name == name){
                if(bool){
                    return dB.items[i];
                } else{
                    return [dB.items, i];
                }
            } else if (i == dB.items.length){
                err ='Could Not Find Item';
                return err;
            }
        }
    },
    async createItem(message,args,guildId){
        let dB = await masterdb.getGuildConfig(guildId).items
        if(args[0] && args[1]){
            itemName =  args[0].replaceAll('_', " ");
            for(i=0;i<dB.length;i++){
                if(dB[i].name == itemName){
                    err = "An Item with this name already exists";
                    return err;
                }
            }
            cost = parseInt(args[1]);
            item = {
                "name": itemName,
                "price": cost
            }
            if(args[2]){
                switch(args[2]){
                    case 'Role':
                    case 'role':
                        item.type = 'role';
                        item.typeParam = args[3];
                        break;
                    case 'Points':
                    case 'points':
                        pointsNum = parseInt(args[3]);
                        if(isNaN(pointsNum)){
                            err = 'Given Argument is not a valid number'
                            return err;
                        } else if(pointsNum == 0){
                            err = 'Given Number cannot be 0';
                            return err;
                        }
                        item.type ='points';
                        item.typeParam = pointsNum;
                        break;
                }
            }
            dB.push(item);
            await masterdb.editGuildValue(guildId,"items",dB)
            return item;
        } else {
            err = "Valid Args: Name | Cost | Type (Optional) | Type Option (Optional)";
            return err;
        }
    },
    async deleteItem(message,args,guildId){
        if(args[0]){
            itemName =  args[0].replaceAll('_', " ");
            err = await this.fetchItem(itemName,true,guildId);
            console.log(err);
            if(typeof err === 'string'){
                return err;
            }
            [items, index] = await this.fetchItem(itemName,false,guildId);
            console.log(items, index)
            if(typeof items === 'object'){
                console.log(items[index], itemName);
                if(items[index].name == itemName){
                    console.log(`Item to Delete: ${itemName}`);
                    items.splice(i, 1);
                    await masterdb.editGuildValue(guildId,"items",items)
                }
            }
        }
    }
}
