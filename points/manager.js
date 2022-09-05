const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json'); // basic config file read
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
const path = require('path');
const os = require('os');
const masterdb = require('../master-db/masterdb');
var manager = module.exports = {
    bot: null,
    dir: null,
    platform: os.platform(),
    folderDirection(){ // Used to automatically detect linux or windows type filesystems to automatically adjust for file searching differences 
        if(this.platform != 'win32'){
            return '/';
        } else {
            return '\\'; // with JS double back slash is pretty much just one back slash for anything using it
        }
    },
    setBot: function(bot){ // funky work around 
        manager.bot = bot;
    },
    getBot(){ // trying to access the var directly has some weird issues sometimes
        return this.bot;
    },
    fetchData: async function(guildId){ // Fetch data from points-db.json
        //console.log(`Guild ID TO GRAB: ${guildId}`);
        fileExists = await masterdb.DoesFileExist(guildId,"points-db").catch((err) => {
            console.log(err);
            fileExists = false;
        });
        //console.log(`Points Database File Status: ${fileExists}`);
        if(fileExists){
            data = await masterdb.getGuildJson(guildId,"points-db").catch((err)=>{console.error(err)});
        } else {
            data = undefined;
        }
        return data;
        
    },
    fetchItems: async function(guildId){
        //console.log(`Guild ID TO GRAB: ${guildId}`);
        fileExists = await masterdb.DoesFileExist(guildId,"items").catch((err) => {
            console.log(err);
            fileExists = false;
        });
        //console.log(`Points Database File Status: ${fileExists}`);
        if(fileExists){
            data = await masterdb.getGuildJson(guildId,"items").catch((err)=>{console.error(err)});
        } else {
            data = undefined;
        }
        return data;
    },
    async saveDB(newData,guildId){
        //console.log(newData);
        await masterdb.writeGuildJsonFile(guildId,"points-db",newData).then(()=>{console.log(`Saved Points Database File for Guild ID: ${guildId}`)}).catch((err)=>{console.error(err)});
    },
    async saveItemsDB(newData,guildId){
        //console.log(newData);
        await masterdb.writeGuildJsonFile(guildId,"items",newData).then(()=>{console.log(`Saved Points Database File for Guild ID: ${guildId}`)}).catch((err)=>{console.error(err)});
    },
    async fetchUser(id,bool,guildId){ // if true just return the user Data point, used for Read only instances
        let dB = await this.fetchData(guildId);
        //console.log(dB);
        users = dB.users;
        if(users.length >= 1){
            for(i=0;i<users.length;i++){
                let user = users[i];
                if(user.id == id){
                    if(bool){
                        return users[i];
                    } else {return [users, i];}
                }
            }
        }
    },
    setupUser: async function(user,guildId){ // this is just the user data template
        dbData = await this.fetchData(guildId);
        if(typeof dbData === 'undefined'){
            dbData = {};
            dbData.startingBalance = 1000;
        }
        let newUserData = {
            "balance": {"cash":0,"bank": dbData.startingBalance}, 
            "id": user.id,
            "username": user.username, 
            "inv": [],
            "cooldown": false,
            "workCooldown": false,
            "setOnCooldown": null,
            "crimeCooldown": false,
            "lastCrime": null,
        }
        //console.log(newUserData);
        return newUserData;
    },
    async addNewPropGlobal(prop, value, guildId){ // so we dont have to reset the economy when a new Property is introduced
        let dB = await this.fetchData(guildId);
        let count = 0;
        for(i=0;i<dB.users.length;i++){
            if(typeof dB.users[i][prop] === 'undefined'){
                console.log(prop);
                dB.users[i][prop] = value;
            } else {
                count++;
            }
        }
        await this.saveDB(db,guildId);
        if(count == dB.users.length){
            return `Everyone already has this property. ${count}`;
        } else {
            return `Successfully set prop ${prop} for every user but ${count} amount of people already had it`;
        }
    },
    async removePropGlobal(prop,guildId){
        let dB = await this.fetchData(guildId);
        let count = 0;
        for(i=0;i<dB.users.length;i++){
            if(typeof dB.users[i][prop] === 'undefined'){
                count++;
            } else {
                delete dB.users[i][prop];
            }
        }
        await this.saveDB(db,guildId);
        if(count == dB.users.length){
            return `Removed property ${prop} from ${count} users`;
        } else {
            return `Removed property ${prop} but ${count} users already didn't have it`;
        }
    },
    removeUser: async function(id,guildId){ // remove a user from the points-db for whatever reason
        let dbData = await this.fetchData(guildId);
        for(i=0;i<dbData.users.length;i++){
            if(dbData.users[i].id == id){
                dbData.users.splice(i, 1);
            }
        }
        await this.saveDB(dbData);
    },
    addUser: async function(user,guildId){ // used for when a user joins the server
        let dbData = await this.fetchData(guildId);
        let newUserData = this.setupUser(user);
        dbData.users.push(newUserData);
        await this.saveDB(dbData);
    },
    resetUser(user){
        console.log(user)
        this.removeUser(user.id);
        pglibrary.sleep(10);
        this.addUser(user.user);
    },
    /**
    * Runs Setup for Points Manager for a guild, goes through each user in a guild and adds them to the servers json file
    * @param {boolean} Force If true forces the setup, useful for when restarting the Database from a command
    * @param {string} GuildId The Guild ID (Has to be String) to setup for
    * @returns {boolean} Return True when done
    */
    setup: async function(bool,guildId){ // if the bool is true it overrides everything and force restarts points-db.json
        let startTime = Date.now();
        console.log(`Setting Up ${this.bot.guilds.cache.get(guildId).name}`);
        dB = await this.fetchData(guildId);
        if(typeof dB === "undefined"){
            dB = {setup: false,users:[],pointSymbol:"💰",earnCooldown:10000,workCooldownTime:86400000,crimeCooldownTime:86400000,pointsPerMessage:5,pointsMulti:1,pointsTax:5,startingBalance:1000,maxInventorySize:10}
        }
        itemStatus = await masterdb.DoesFileExist(guildId,"items");
        if(!itemStatus){
            items = [];
            await masterdb.writeGuildJsonFile(guildId,"items",items).then((status)=>{
                console.log(status);
            }).catch((err)=>{console.error(err)});
        }
        if(dB.setup && !bool){
            return;
        } else if(bool){
            dB.users = []; // when forced restart
            await this.saveDB(db,guildId); 
            pglibrary.sleep(10);
        }
        if(!dB.setup){
            dB.users = [];
        }
        let guild = this.bot.guilds.cache.get(guildId);
        let userList = await guild.members.fetch()
        for(const member of userList){
            user = member[1].user;
            if(user.bot){
                console.error(`User ${user.username} is a Bot`);
                continue;
            }
            newUser = await this.setupUser(user,guildId);
            dB.users.push(newUser);
        }
        dB.setup = true;
        //console.log(dB,guildId);
        await this.saveDB(dB,guildId);
        if(bool){
            //pglibrary.EconChannelLog('The Server Economy has been reset', 'Admin Forced', this.bot);
        } else {
            //pglibrary.EconChannelLog('Server Economy has been setup', 'Automated On Start Up', this.bot);
        }
        console.log(`Finished Task in: ${Date.now() - startTime}ms`);
        return Promise.resolve(`Finished Setup for ${this.bot.guilds.cache.get(guildId).name}`);
    },
    giveUserPoints: async function(id, amount, location,taxFree, guildId){
        console.log(guildId);
        let [users, userIndex] = await this.fetchUser(id,false,guildId);
        let dB = await this.fetchData(guildId);
        if(location == "bank"){
            if(taxFree){
                users[userIndex].balance.bank += (amount * dB.pointsMulti);
                users[userIndex].balance.bank = Math.round(users[userIndex].balance.bank*100)/100;
            } else {
                users[userIndex].balance.bank += ((amount - pglibrary.percentage(amount, dB.pointsTax)) * dB.pointsMulti);
                users[userIndex].balance.bank = Math.round(users[userIndex].balance.bank*100)/100;
            }
        } else if(location == "cash"){
            if(taxFree){
                users[userIndex].balance.cash += (amount * dB.pointsMulti);
                users[userIndex].balance.cash = Math.round(users[userIndex].balance.cash*100)/100;
            } else {
                users[userIndex].balance.cash += ((amount - pglibrary.percentage(amount, dB.pointsTax)) * dB.pointsMulti);
                users[userIndex].balance.cash = Math.round(users[userIndex].balance.cash*100)/100;
            }
        } else {
            console.error('Invalid Points Location Provided');
            process.exit(1);
            return;
        }
        dB.users = users;
        await this.saveDB(dB,guildId);
        return Promise.resolve(`Gave User: ${id} ${amount} points`);
        //pglibrary.EconChannelLog(`User ${id} has been given/removed ${pglibrary.commafy(amount)} points`, 'Command', this.bot);
    },
    setUserPoints: async function(id, points, location,guildId){
        let [users, userIndex] = await this.fetchUser(id,false,guildId);
        let dB = await this.fetchData(guildId);
        if(location == "bank"){
            users[userIndex].balance.bank += points;
        } else if(location == "cash"){
            users[userIndex].balance.cash += points;
        } else {
            err = "Invalid Location";
            return err;
        }
        dB.users = users;
        await this.saveDB(db,guildId);
        //pglibrary.EconChannelLog(`User ${id} points have been set to ${pglibrary.commafy(points)}.`, `Admin Command`, this.bot);
    },
    async donatePoints(patronId, targetID, amount,location,guildId){
        let dB = await this.fetchData(guildId);
        let [users, patronIndex] = await this.fetchUser(patronId,false,guildId);
        let [_, targetIndex] = await this.fetchUser(targetID,false,guildId);
        console.log(location);
        if(users[patronIndex].balance < amount){
            if(location == "bank"){
                users[patronIndex].balance.bank -= amount;
                users[targetIndex].balance.bank += amount;
            } else if(location == "cash"){
                users[patronIndex].balance.cash -= amount;
                users[targetIndex].balance.cash += amount;
            } else {
                err = "Invalid Location";
                return err;
            }
            dB.users = users;
            await this.saveDB(db,guildId);
        } else {
            err = "You do not have enough points";
            return err;
        }
        //pglibrary.EconChannelLog(`User ${patronId} has given ${targetID} ${pglibrary.commafy(amount)} points.`, `Command`, this.bot);
    },
    async messagePoints(id,guildId){
        console.log(`Guild: ${guildId}`);
        dB = await this.fetchData(guildId);
        try{
            [users, userIndex] = await this.fetchUser(id,false,guildId);
            if(!users[userIndex].cooldown){
                console.log(`Giving User: ${id}, ${dB.pointsPerMessage} points`);
                users[userIndex].balance.cash += ((dB.pointsPerMessage - pglibrary.percentage(dB.pointsPerMessage, dB.pointsTax)) * dB.pointsMulti);
                users[userIndex].balance.cash = Math.round(users[userIndex].balance.cash*100)/100;
                users[userIndex].cooldown = true;
                dB.users = users;
                await this.saveDB(dB,guildId);
                setTimeout(()=> this.removeUserCooldown(id,guildId), dB.earnCooldown);
            }
        } catch(err){
            console.log(err);
        }
    },
    async removeUserCooldown(id,guildId){
        dB = await this.fetchData(guildId);
        [users, userIndex] = await this.fetchUser(id,false,guildId);
        users[userIndex].cooldown = false;
        dB.users = users;
        await this.saveDB(dB,guildId);
    },
    async getUserBalance(id, guildId){
        console.log(`Checking User ${id}'s Balance`);
        [users, userIndex] = await this.fetchUser(id,false,guildId);
        return [users[userIndex].balance.cash, users[userIndex].balance.bank];
    },
    async getServerStats(guildId){
        startTime = Date.now();
        dB = await this.fetchData(guildId);
        let bank = 0;
        let cash = 0;
        dB.users.forEach(user =>{
            bank += user.balance.bank;
            cash += user.balance.cash;
        });
        total = cash+bank;
        console.log(total);
        console.log(`Time to Complete: ${Date.now() - startTime}ms`);
        return [cash,bank,total];
    },
    async depositPoints(id,amount,guildId){
        dB = await this.fetchData(guildId);
        [usersData, userIndex] = await this.fetchUser(id,false,guildId);
        if(amount <= dB.users[userIndex].balance.cash){
            dB.users[userIndex].balance.cash -= amount;
            dB.users[userIndex].balance.bank += Math.round(amount);
            console.log(dB.users[userIndex]);
            await this.saveDB(dB,guildId);
        } else {
            err = "Not Enough Points to Deposit";
            return err;
        }
        //pglibrary.EconChannelLog(`User ${id} has deposited ${pglibrary.commafy(amount)} points`, `Command`, this.bot);
    },
    async withdrawPoints(id,amount, guildId){
        dB = await this.fetchData(guildId);
        [usersData, userIndex] = await this.fetchUser(id,false,guildId);
        if(amount <= dB.users[userIndex].balance.bank){
            dB.users[userIndex].balance.bank -= amount;
            dB.users[userIndex].balance.cash += amount;
            await this.saveDB(dB,guildId);
        } else {
            err = "Not Enough Points to Withdraw";
            return err;
        }
        //pglibrary.EconChannelLog(`User ${id} has Withdrew ${pglibrary.commafy(amount)} points`, `Command`, this.bot);
    },
    async sortForLeaderboard(guildId){
        dB = await this.fetchData(guildId);
        userDB = dB.users;
        allTotalArray = [];
        startTime = Date.now();
        userDB.forEach(user => {
            total = user.balance.cash + user.balance.bank;
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
        dB = await this.fetchData(guildId);
        [users, userIndex] = await this.fetchUser(id,false,guildId);
        if(amount){
            if(amount >= 2){
                for(i=0;i<amount;i++){
                    users[userIndex].inv.push(item);
                }
            } else {
                users[userIndex].inv.push(item);
            }
        } else {
            users[userIndex].inv.push(item);
        }
        dB.users = users;
        await this.saveDB(dB,guildId);
    },
    async useItem(id, item, message,guildId){
        dB = await this.fetchData(guildId);
        [users, userIndex] = await this.fetchUser(id,false,guildId);
        if(users[userIndex].inv.length <= 0){
            return Promise.reject('Your Inventory is Empty!');
        }
        for(i=0;i<users[userIndex].inv.length;i++){
            console.log(`User Inv Index: ${i}`);
            console.log(users[userIndex].inv[i]);
            if(users[userIndex].inv[i].name == item.name){
                users[userIndex].inv.splice(i, 1);
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
                        if(member.id == users[userIndex].id){
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
                users[userIndex].balance.cash += item.typeParam;
                return Promise.resolve('done');
        }
        dB.users = users;
        this.saveDB(dB,guildId);
    },
    async work(id,amount,guildId){
        dB = await this.fetchData(guildId);
        [users, userIndex] = await this.fetchUser(id,false,guildId);
        if(users[userIndex].workCooldown){
            return;
        }
        users[userIndex].balance.cash += ((amount - pglibrary.percentage(amount, dB.pointsTax)) * dB.pointsMulti);
        users[userIndex].balance.cash = Math.round(users[userIndex].balance.cash*100)/100; // round to the hundredths place
        users[userIndex].workCooldown = true;
        users[userIndex].setOnCooldown = Date.now();
        dB.users = users;
        await this.saveDB(dB,guildId);
        setTimeout(()=> this.removeWorkCooldown(id), dB.workCooldownTime);
        //pglibrary.EconChannelLog(`User ${id} has worked and earned ${pglibrary.commafy(amount)} points`, `Command`, this.bot);
    },
    async crime(id,amount,guildId){
        dB = await this.fetchData(guildId);
        [users, userIndex] = await this.fetchUser(id,false,guildId);
        if(users[userIndex].crimeCooldown){
            return;
        }
        users[userIndex].balance.cash += (amount * dB.pointsMulti);
        users[userIndex].balance.cash = Math.round(users[userIndex].balance.cash*100)/100; // round to the hundredths place
        users[userIndex].crimeCooldown = true;
        users[userIndex].lastCrime = Date.now();
        dB.users = users;
        await this.saveDB(dB,guildId);
        setTimeout(()=> this.removeCrimeCooldown(id,guildId), dB.crimeCooldownTime);
        //pglibrary.EconChannelLog(`User ${id} has committed a crime and earned ${pglibrary.commafy(amount)} points`, `Command`, this.bot);
    },
    async removeWorkCooldown(id,guildId){
        dB = await this.fetchData(guildId);
        [users, userIndex] = await this.fetchUser(id,false,guildId);
        users[userIndex].workCooldown = false;
        dB.users = users;
        await this.saveDB(dB,guildId);
        //pglibrary.EconChannelLog(`Removed Work Cooldown for user ${id}`, `Automated Timer`, this.bot);
    },
    async removeCrimeCooldown(id,guildId){
        dB = await this.fetchData(guildId);
        [users, userIndex] = await this.fetchUser(id,false,guildId);
        users[userIndex].crimeCooldown = false;
        dB.users = users;
        await this.saveDB(dB,guildId);
        //pglibrary.EconChannelLog(`Removed Crime Cooldown for user ${id}`, `Automated Timer`, this.bot);
    },
    async setEconSymbol(input,guildId){
        dB = await this.fetchData(guildId);
        dB.pointSymbol = input;
        await this.saveDB(db,guildId);
    },
    async checkPausedTimers(guildId){ // a function used so that if the bot restarts cooldowns using the setTimeout are taken care of as they are cleared on restart
        dB = await this.fetchData(guildId);
        users = dB.users;  
        for(i=0;i<users.length;i++){
            if(users[i].workCooldown && typeof users[i].setOnCooldown !== 'undefined'){
                if(Date.now() >= users[i].setOnCooldown + dB.workCooldownTime){
                    users[i].workCooldown = false;
                    users[i].setOnCooldown = null;
                }
            }
            if(users[i].crimeCooldown && typeof users[i].lastCrime !== 'undefined'){
                if(Date.now() >= users[i].lastCrime + dB.crimeCooldownTime){
                    users[i].crimeCooldown = false;
                    users[i].lastCrime = null;
                }
            }
        }
        dB.users = users;
        await this.saveDB(dB,guildId);
    },
    async symbol(guildId){ // read only thing
        dB = await this.fetchData(guildId);
        return dB.pointSymbol;
    },
    async fetchItem(name,bool,guildId){
        if(!name){
            err = "Not Name Provided";
            return err;
        }
        dB = await this.fetchItems(guildId);
        console.log(dB.length);
        for(i=0;i<dB.length;i++){
            console.log(i);
            if(dB[i].name == name){
                if(bool){
                    return dB[i];
                } else{
                    return [dB, i];
                }
            } else if (i == dB.length){
                err ='Could Not Find Item';
                return err;
            }
        }
    },
    async createItem(message,args,guildId){
        dB = await this.fetchItems(guildId);
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
            await this.saveItemsDB(dB,guildId);
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
                    await this.saveItemsDB(items,guildId);
                }
            }
        }
    },
    async ItemsSetup(guildId){
        items = await this.fetchItems(guildId);
        if(typeof items === 'undefined'){
            items = [];
            await this.saveItemsDB(items,guildId);
        }
        return Promise.resolve(`Finished Creating Items DB File`);
    }
}
