const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json'); // basic config file read
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
const path = require('path');
var manager = module.exports = {
    bot: null,
    dir: null,
    setBot: function(bot){
        manager.bot = bot;
    },
    fetchData: function(){
        this.dir = __dirname;
        console.log(this.dir);
        return JSON.parse(fs.readFileSync(this.dir + '\\points-db.json'));
    },
    fetchItems: function(){
        this.dir = __dirname;
        console.log(this.dir);
        return JSON.parse(fs.readFileSync(this.dir +'\\items.json'));
    },
    saveDB(newData){
        this.dir = __dirname;
        console.log(this.dir);
        pglibrary.WriteToJson(newData, `${this.dir}` + '\\points-db.json');
    },
    fetchUser(id){
        let users = this.fetchData().users;
        if(users.length >= 1){
            for(i=0;i<users.length;i++){
                let user = users[i];
                if(user.id == id){
                    return [users, i];
                }
            }
        } else {
            return false;
        }
    },
    setupUser: function(user){
        console.log(user.username);
        let dbData = this.fetchData();
        let newUserData = {
            "balance": {"cash":0,"bank": dbData.startingBalance}, 
            "id": user.id,
            "username": user.username, 
            "inv": [],
            "cooldown": false
        }
        return newUserData;
    },
    removeUser: function(id){
        let dbData = this.fetchData();
        for(i=0;i<dbData.users.length;i++){
            if(dbData.users[i].id == id){
                dbData.users.splice(i, 1);
            }
        }
        this.saveDB(dbData);
    },
    addUser: function(user){
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
    firstSetup: async function(bool){
        dB = this.fetchData();
        if(dB.setup && !bool){
            return;
        } else if(bool){
            dB.users = []; // when forced restart
            this.saveDB(dB); 
            pglibrary.sleep(10);
        }
        let guild = this.bot.guilds.cache.get(config.serverid);
        console.log(guild);
        let startTime = Date.now();
        let userList = await guild.members.fetch().then(members =>{
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
    },
    giveUserPoints: function(id, amount, location){
        let [users, userIndex] = this.fetchUser(id);
        let dB = this.fetchData();
        if(location == "bank"){
            users[userIndex].balance.bank += amount;
        } else if(location == "cash"){
            users[userIndex].balance.cash += amount;
        } else {
            err = "Invalid Location";
            return err;
        }
        dB.users = users;
        this.saveDB(dB);
    },
    setUserPoints: function(id, points, location){
        let [users, userIndex] = this.fetchUser(id);
        let dB = this.fetchData();
        if(location == "bank"){
            users[userIndex].balance.bank += amount;
        } else if(location == "cash"){
            users[userIndex].balance.cash += amount;
        } else {
            err = "Invalid Location";
            return err;
        }
        dB.users = users;
        this.saveDB(dB);
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
    },
    messagePoints(id){
        dB = this.fetchData();
        try{
            [users, userIndex] = this.fetchUser(id);
            if(!users[userIndex].cooldown){
                console.log(`Giving User: ${id}, ${dB.pointsPerMessage} points`);
                users[userIndex].balance.cash += ((dB.pointsPerMessage - pglibrary.percentage(dB.pointsPerMessage, dB.pointsTax)) * dB.pointsMulti);
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
        } else {
            err = "Not Enough Points to Deposit";
            return err;
        }
    },
    withdrawPoints(id,amount){
        dB = this.fetchData();
        [users, userIndex] = this.fetchUser(id);
        if(amount <= users[userIndex].balance.bank){
            users[userIndex].balance.bank -= amount;
            users[userIndex].balance.cash += amount;
        } else {
            err = "Not Enough Points to Withdraw";
            return err;
        }
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
        console.log(finalArray);
        console.log(`Took ${Date.now()-startTime}ms`)
        return finalArray;
    },
    giveUserItem(id, item){
        dB = this.fetchData();
        [users, userIndex] = this.fetchUser(id);
        users[userIndex].inv.push(item);
        dB.users = users;
        this.saveDB(dB);
    },
    useItem(id, item){
        dB.this.fetchData();
        [users, userIndex] = this.fetchUser(id);
        for(i=0;i<users[userIndex].inv.length;i++){
            if(users[userIndex].inv[i].name == item.name){
                users[userIndex].inv.splice(i, 1);
            } else {
                err = "Can't find Item";
                return err;
            }
        }
        dB.users = users;
        this.saveDB(dB);
        if(item.func){
            item.func();
        }
    }
}
