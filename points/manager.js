const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json'); // basic config file read
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
const path = require('path');
const os = require('os');
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
    fetchData: function(){ // Fetch data from points-db.json
        this.dir = __dirname; // get Directory Name for this File as we access it from other places
        return JSON.parse(fs.readFileSync(this.dir + this.folderDirection() +'points-db.json'));
    },
    fetchItems: function(){
        this.dir = __dirname;
        return JSON.parse(fs.readFileSync(this.dir + this.folderDirection() +'items.json'));
    },
    saveDB(newData){
        this.dir = __dirname;
        pglibrary.WriteToJson(newData, `${this.dir + this.folderDirection()}points-db.json`);
    },
    fetchUser(id,bool){ // if true just return the user Data point, used for Read only instances
        let users = this.fetchData().users;
        if(users.length >= 1){
            for(i=0;i<users.length;i++){
                let user = users[i];
                if(user.id == id){
                    if(bool){
                        return users[i];
                    } else {return [users, i];}
                }
            }
        } else {
            return false;
        }
    },
    setupUser: function(user){ // this is just the user data template
        let dbData = this.fetchData();
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
        return newUserData;
    },
    addNewPropGlobal(prop, value){ // so we dont have to reset the economy when a new Property is introduced
        let dB = this.fetchData();
        let count = 0;
        for(i=0;i<dB.users.length;i++){
            if(typeof dB.users[i][prop] === 'undefined'){
                console.log(prop);
                dB.users[i][prop] = value;
            } else {
                count++;
            }
        }
        this.saveDB(dB);
        if(count == dB.users.length){
            return `Everyone already has this property. ${count}`;
        } else {
            return `Successfully set prop ${prop} for every user but ${count} amount of people already had it`;
        }
    },
    removePropGlobal(prop){
        let dB = this.fetchData();
        let count = 0;
        for(i=0;i<dB.users.length;i++){
            if(typeof dB.users[i][prop] === 'undefined'){
                count++;
            } else {
                delete dB.users[i][prop];
            }
        }
        this.saveDB(dB);
        if(count == dB.users.length){
            return `Removed property ${prop} from ${count} users`;
        } else {
            return `Removed property ${prop} but ${count} users already didn't have it`;
        }
    },
    removeUser: function(id){ // remove a user from the points-db for whatever reason
        let dbData = this.fetchData();
        for(i=0;i<dbData.users.length;i++){
            if(dbData.users[i].id == id){
                dbData.users.splice(i, 1);
            }
        }
        this.saveDB(dbData);
    },
    addUser: function(user){ // used for when a user joins the server
        let dbData = this.fetchData();
        let newUserData = this.setupUser(user);
        dbData.users.push(newUserData);
        this.saveDB(dbData);
    },
    resetUser(user){
        console.log(user)
        this.removeUser(user.id);
        pglibrary.sleep(10);
        this.addUser(user.user);
    },
    firstSetup: async function(bool){ // if the bool is true it overrides everything and force restarts points-db.json
        dB = this.fetchData();
        if(dB.setup && !bool){
            return;
        } else if(bool){
            dB.users = []; // when forced restart
            this.saveDB(dB); 
            pglibrary.sleep(10);
        }
        let guild = this.bot.guilds.cache.get(config.serverid);
        let startTime = Date.now();
        let userList = await guild.members.fetch().then(members =>{ // since the cache doesnt get EVERY user we manually ask for each user in the server
            members.forEach(member => {
                if(member.user.bot){
                    console.log(`User is a Bot`);
                    return;
                }
                let newUser = this.setupUser(member.user);
                dB.users.push(newUser);
            });
        });
        console.log(`Finished Task in: ${Date.now() - startTime}ms`);
        dB.setup = true;
        this.saveDB(dB);
        if(bool){
            pglibrary.EconChannelLog('The Server Economy has been reset', 'Admin Forced', this.bot);
        } else {
            pglibrary.EconChannelLog('Server Economy has been setup', 'Automated On Start Up', this.bot);
        }
    },
    giveUserPoints: function(id, amount, location,taxFree){
        let [users, userIndex] = this.fetchUser(id);
        let dB = this.fetchData();
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
        this.saveDB(dB);
        pglibrary.EconChannelLog(`User ${id} has been given/removed ${pglibrary.commafy(amount)} points`, 'Command', this.bot);
    },
    setUserPoints: function(id, points, location){
        let [users, userIndex] = this.fetchUser(id);
        let dB = this.fetchData();
        if(location == "bank"){
            users[userIndex].balance.bank += points;
        } else if(location == "cash"){
            users[userIndex].balance.cash += points;
        } else {
            err = "Invalid Location";
            return err;
        }
        dB.users = users;
        this.saveDB(dB);
        pglibrary.EconChannelLog(`User ${id} points have been set to ${pglibrary.commafy(points)}.`, `Admin Command`, this.bot);
    },
    donatePoints(patronId, targetID, amount){
        let dB = this.fetchData();
        let [users, patronIndex] = this.fetchUser(patronId);
        let [_, targetIndex] = this.fetchUser(targetID);
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
            this.saveDB(dB);
        } else {
            err = "You do not have enough points";
            return err;
        }
        pglibrary.EconChannelLog(`User ${patronId} has given ${targetID} ${pglibrary.commafy(amount)} points.`, `Command`, this.bot);
    },
    messagePoints(id){
        dB = this.fetchData();
        try{
            [users, userIndex] = this.fetchUser(id);
            if(!users[userIndex].cooldown){
                console.log(`Giving User: ${id}, ${dB.pointsPerMessage} points`);
                users[userIndex].balance.cash += ((dB.pointsPerMessage - pglibrary.percentage(dB.pointsPerMessage, dB.pointsTax)) * dB.pointsMulti);
                users[userIndex].balance.cash = Math.round(users[userIndex].balance.cash*100)/100;
                users[userIndex].cooldown = true;
                dB.users = users;
                this.saveDB(dB);
                setTimeout(()=> this.removeUserCooldown(id), dB.earnCooldown);
            }
        } catch{
            console.log(`Whoops`);
        }
    },
    removeUserCooldown(id){
        dB = this.fetchData();
        [users, userIndex] = this.fetchUser(id);
        users[userIndex].cooldown = false;
        dB.users = users;
        this.saveDB(dB);
    },
    getUserBalance(id){
        console.log(`Checking User ${id}'s Balance`);
        [users, userIndex] = this.fetchUser(id);
        return [users[userIndex].balance.cash, users[userIndex].balance.bank];
    },
    getServerStats(){
        startTime = Date.now();
        dB = this.fetchData();
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
    depositPoints(id,amount){
        dB = this.fetchData();
        [users, userIndex] = this.fetchUser(id);
        if(amount <= users[userIndex].balance.cash){
            users[userIndex].balance.cash -= amount;
            users[userIndex].balance.bank += amount;
            users[userIndex].balance.bank = Math.round(users[userIndex].balance.bank*100)/100;
            dB.users = users;
            this.saveDB(dB);
        } else {
            err = "Not Enough Points to Deposit";
            return err;
        }
        pglibrary.EconChannelLog(`User ${id} has deposited ${pglibrary.commafy(amount)} points`, `Command`, this.bot);
    },
    withdrawPoints(id,amount){
        dB = this.fetchData();
        [users, userIndex] = this.fetchUser(id);
        if(amount <= users[userIndex].balance.bank){
            users[userIndex].balance.bank -= amount;
            users[userIndex].balance.cash += amount;
            dB.users = users;
            this.saveDB(dB);
        } else {
            err = "Not Enough Points to Withdraw";
            return err;
        }
        pglibrary.EconChannelLog(`User ${id} has Withdrew ${pglibrary.commafy(amount)} points`, `Command`, this.bot);
    },
    sortForLeaderboard(){
        userDB = this.fetchData().users;
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
    giveUserItem(id, item,amount){
        dB = this.fetchData();
        [users, userIndex] = this.fetchUser(id);
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
        this.saveDB(dB);
    },
    async useItem(id, item, message){
        return new Promise(async function(res,rej){
            dB = manager.fetchData();
            [users, userIndex] = manager.fetchUser(id);
            if(users[userIndex].inv.length <= 0){
                rej('Your Inventory is Empty!');
                return;
            }
            for(i=0;i<users[userIndex].inv.length;i++){
                console.log(`User Inv Index: ${i}`);
                console.log(users[userIndex].inv[i]);
                if(users[userIndex].inv[i].name == item.name){
                    users[userIndex].inv.splice(i, 1);
                } else {
                    rej(`Your Inventory Does not contain ${item.name}`);
                    return;
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
                                res('done');
                            }
                        });
                    });
                case 'points':
                    users[userIndex].balance.cash += item.typeParam;
                    res('done');
            }
            dB.users = users;
            manager.saveDB(dB);
        });
    },
    work(id,amount){
        dB = this.fetchData();
        [users, userIndex] = this.fetchUser(id);
        if(users[userIndex].workCooldown){
            return 'false';
        }
        users[userIndex].balance.cash += ((amount - pglibrary.percentage(amount, dB.pointsTax)) * dB.pointsMulti);
        users[userIndex].balance.cash = Math.round(users[userIndex].balance.cash*100)/100; // round to the hundredths place
        users[userIndex].workCooldown = true;
        users[userIndex].setOnCooldown = Date.now();
        dB.users = users;
        this.saveDB(dB);
        setTimeout(()=> this.removeWorkCooldown(id), dB.workCooldownTime);
        pglibrary.EconChannelLog(`User ${id} has worked and earned ${pglibrary.commafy(amount)} points`, `Command`, this.bot);
    },
    crime(id,amount){
        dB = this.fetchData();
        [users, userIndex] = this.fetchUser(id);
        if(users[userIndex].crimeCooldown){
            console.log(`User: ${users[userIndex].id} is on cooldown`);
            return 'false';
        }
        users[userIndex].balance.cash += (amount * dB.pointsMulti);
        users[userIndex].balance.cash = Math.round(users[userIndex].balance.cash*100)/100; // round to the hundredths place
        users[userIndex].crimeCooldown = true;
        users[userIndex].lastCrime = Date.now();
        dB.users = users;
        this.saveDB(dB);
        setTimeout(()=> this.removeCrimeCooldown(id), dB.crimeCooldownTime);
        pglibrary.EconChannelLog(`User ${id} has committed a crime and earned ${pglibrary.commafy(amount)} points`, `Command`, this.bot);
    },
    removeWorkCooldown(id){
        dB = this.fetchData();
        [users, userIndex] = this.fetchUser(id);
        users[userIndex].workCooldown = false;
        dB.users = users;
        this.saveDB(dB);
        pglibrary.EconChannelLog(`Removed Work Cooldown for user ${id}`, `Automated Timer`, this.bot);
    },
    removeCrimeCooldown(id){
        dB = this.fetchData();
        [users, userIndex] = this.fetchUser(id);
        users[userIndex].crimeCooldown = false;
        dB.users = users;
        this.saveDB(dB);
        pglibrary.EconChannelLog(`Removed Crime Cooldown for user ${id}`, `Automated Timer`, this.bot);
    },
    setEconSymbol(input){
        dB = this.fetchData();
        dB.pointSymbol = input;
        this.saveDB(dB);
    },
    checkPausedTimers(){ // a function used so that if the bot restarts cooldowns using the setTimeout are taken careoff as they are cleared on restart
        dB = this.fetchData();
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
        this.saveDB(dB);
    },
    symbol(){ // read only thing
        dB = this.fetchData();
        return dB.pointSymbol;
    }
}
