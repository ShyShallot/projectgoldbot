const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json'); // basic config file read
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
const path = require('path');
const os = require('os');
const masterdb = require('../master-db/masterdb');
const { fetchData, removeUser, addUser } = require('../points/manager');
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
    async fetchData(guildId){ // Fetch data from level-db.json
        //console.log(`Guild ID TO GRAB: ${guildId}`);
        fileExists = await masterdb.doesFileExist(guildId,"level-db").catch((err) => {
            console.log(err);
            fileExists = false;
        });
        //console.log(`Points Database File Status: ${fileExists}`);
        if(fileExists){
            data = await masterdb.getGuildJson(guildId,"level-db").catch((err)=>{console.error(err)});
        } else {
            data = undefined;
        }
        return data;
    },
    async saveDB(newData,guildId){
        await masterdb.writeGuildJsonFile(guildId,"level-db",newData).then(()=>{console.log(`Saved Level Database File for Guild ID: ${guildId}`)}).catch((err)=>{console.error(err)});
        return Promise.resolve();
    },
    /**
    * Writes JS Object data to a JSON File
    * @param {number} userID Provide the User's ID
    * @param {boolean} true_false If True returns the user Object for read only purposes else returns the users Array with the users Index
    * @returns {number|Object}  Returns user Object if true_false is true else returns [userArray, userIndex];
    */
    async fetchUser(id,bool,guildId){ // if true just return the user Data point, used for Read only instances
        console.log(guildId);
        let dB = await this.fetchData(guildId);
        users = dB.users;
        if(typeof users === 'undefined'){
            return false;
        }
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
        let newUserData = {
            "xp": 0,
            "level":1,
            "id": user.id,
            "username": user.username, 
            "cooldown": false,
        }
        return newUserData;
    },
    async removeUser(id,guildId){ // remove a user from the points-db for whatever reason
        let dbData = await this.fetchData(guildId);
        for(i=0;i<dbData.users.length;i++){
            if(dbData.users[i].id == id){
                dbData.users.splice(i, 1);
            }
        }
        await this.saveDB(dbData,guildId);
    },
    async addUser(user,guildId){ // used for when a user joins the server
        let dbData = await this.fetchData(guildId);
        let newUserData = this.setupUser(user);
        dbData.users.push(newUserData);
        await this.saveDB(dbData,guildId);
    },
    async resetUser(user,guildId){
        console.log(user,guildId)
        await this.removeUser(user.id,guildId);
        pglibrary.sleep(10);
        await this.addUser(user.user,guildId);
    },
    /**
    * Runs Setup for Level Manager for a guild, goes through each user in a guild and adds them to the servers json file, Also on Startup even if already done before it catches everything up by adding Levels if the user already has a Role for that Level Reward
    * @param {boolean} Force If true forces the setup, useful for when restarting the Database from a command
    * @param {string} GuildId The Guild ID (Has to be String) to setup for
    * @returns {boolean} Return True when done
    */
    setup: async function(bool,guildId){ // if the bool is true it overrides everything and force restarts points-db.json
        dB = await this.fetchData(guildId);
        if(typeof dB === 'undefined'){
            deafultConfig = {"setup":true,"xpPerMessage":50,"messageCooldownTime":10000,"xpMultiplier":1,"nextLevelXpMulti":3,"lastupdated":undefined,"levelsRewards":[],"users":[]}
            await this.saveDB(deafultConfig,guildId);
            dB = deafultConfig;
        }
        if(typeof dB.lastupdated !== 'undefined'){
            if(Date.now() < dB.lastupdated+60000){
                console.log(`Cannot Update Yet`);
                return;
            }
        }
        if(dB.users.length == 0 && dB.setup){
            dB.setup = false;
        }
        if(dB.setup){ // to clear any message cooldowns on startup but only if we have setup before
            console.log(`Server is setup but checking if users have correct levels`);
            let startTime = Date.now();
            users = dB.users;
            if(users.length <= 0){return;}
            await this.removeServerCooldown(guildId);
            if(typeof dB.levelsRewards === 'undefined'){
                console.log(`Done, took: ${Date.now()-startTime}ms`);
                dB.lastupdated = Date.now();
                await this.saveDB(dB,guildId);
                return;
            }
            if(dB.levelsRewards.length == 0){return};
            rewards = dB.levelsRewards.sort((a,b) => b.level-a.level);
            console.log(rewards);
            let guild = this.bot.guilds.cache.get(guildId);
            members = await guild.members.fetch() // since the cache doesnt get EVERY user we manually ask for each user in the server
            console.log(`Checking for existing Levels`);
            members.forEach(async member => {
                if(member.user.bot){
                    console.log(`User is a Bot`);
                    return;
                }
                for(let i=0;i<dB.levelsRewards.length;i++){
                    reward = dB.levelsRewards[i];
                    if(member.roles.cache.some(role =>  role.id === reward.roleID)){
                        userIndex = dB.users.findIndex(usr => usr.id === member.user.id);
                        if(dB.users[userIndex].level >= reward.level){
                            break;
                        }
                        dB.users[userIndex].level = reward.level;
                        dB.users[userIndex].xp = 500 * dB.nextLevelXpMulti * reward.level;
                        break;
                    }
                }
                //console.log(member.id);
            });
            console.log(`Done, took: ${Date.now()-startTime}ms`);
            dB.lastupdated = Date.now();
            await this.saveDB(dB,guildId);
        }
        if(dB.setup && !bool){
            return;
        } else if(bool){
            dB.users = []; // when forced restart
            this.saveDB(dB); 
            pglibrary.sleep(10);
        }
        console.log(`Server is Not Setup`)
        let guild = this.bot.guilds.cache.get(guildId);
        let startTime = Date.now();
        await guild.members.fetch().then(members =>{ // since the cache doesnt get EVERY user we manually ask for each user in the server
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
        dB.lastupdated = Date.now();
        dB.setup = true;
        await this.saveDB(dB,guildId);
        if(bool){
            //glibrary.EconChannelLog('The Server Levelonomy has been reset', 'Admin Forced', this.bot);
        } else {
            //pglibrary.EconChannelLog('Server Levelonomy has been setup', 'Automated On Start Up', this.bot);
        }
        return Promise.resolve("Finished Level Setup");
    },
    async giveUserData(id, amount, bool,guildId){
        let [users, userIndex] = await this.fetchUser(id,false,guildId);
        let dB = await this.fetchData(guildId);
        if(isNaN(amount)){
            err = 'Given XP/Level is not a number';
            return err;
        }
        if(bool){
            dB.users[userIndex].xp += amount;
        } else {
            dB.users[userIndex].level += amount;
            await this.giveRole(message.member, dB.users[userIndex].level++,guildId).then((status) => {console.log(status)}).catch((err) => {console.error(err); return;});
        }
        if(dB.users[userIndex].xp >= await this.calculateNextLevel(id,guildId) && bool){
            await this.giveRole(message.member, dB.users[userIndex].level++,guildId).then((status) => {console.log(status)}).catch((err) => {console.error(err); return;});;
            await this.levelUpUser(id);
            message.channel.send(`<@${message.author.id}>, You have leveled up to Level ${dB.users[userIndex].level++}!`);
        }
        await this.saveDB(dB,guildId);
        //pglibrary.EconChannelLog(`User ${id} has been given/removed ${pglibrary.commafy(amount)} points`, 'Command', this.bot);
    },
    async setUserData(id, amount, bool,guildId){
        let [users, userIndex] = await this.fetchUser(id,false,guildId);
        let dB = await this.fetchData(guildId);
        if(isNaN(amount)){
            err = 'Given XP/Level is not a number';
            return err;
        }
        if(bool){
            dB.users[userIndex].xp += amount;
            //pglibrary.EconChannelLog(`User ${id} xp has been set to ${pglibrary.commafy(users[userIndex].xp += amount)}.`, `Admin Command`, this.bot);
        } else {
            dB.users[userIndex].level = amount;
            dB.users[userIndex].xp = 500 * dB.nextLevelXpMulti * amount;
            //pglibrary.EconChannelLog(`User ${id} level has been set to ${pglibrary.commafy(amount)}.`, `Admin Command`, this.bot);
        }
        await this.saveDB(dB,guildId);
        return Promise.resolve(`Saved User Data for: ${id}`);
    },
    async messageXP(id,message,guildId){
        let dB = await this.fetchData(guildId);
        [users, userIndex] = await this.fetchUser(id,false,guildId) || [];
        if(typeof users === 'undefined'){
            return;
        }
        if(!users[userIndex].cooldown){
            console.log(`Giving User: ${id}, ${dB.xpPerMessage} xp`);
            dB.users[userIndex].xp += dB.xpPerMessage * dB.xpMultiplier;
            dB.users[userIndex].cooldown = true;
            console.log(users[userIndex]);
            if(users[userIndex].xp >= await this.calculateNextLevel(id,guildId)){
                await this.giveRole(message.member, dB.users[userIndex].level++,guildId).then((status) => {console.log(status)}).catch((err) => {console.error(err); return;});
                await this.levelUpUser(id,guildId);
                message.channel.send(`<@${message.author.id}>, You have leveled up to Level ${dB.users[userIndex].level++}!`);
            }
            await this.saveDB(dB,guildId);
            setTimeout(() => this.removeUserCooldown(id,guildId), dB.messageCooldownTime);
        } else {
            console.log(`${id} is on cooldown`);
            return;
        }
    },
    async removeUserCooldown(id,guildId){
        let dB = await this.fetchData(guildId);
        [users, userIndex] = await this.fetchUser(id,false,guildId);
        dB.users[userIndex].cooldown = false;
        await this.saveDB(dB,guildId);
    },
    async removeServerCooldown(guildId){
        console.log(`Removing Cooldowns for all users in ${this.bot.guilds.cache.get(guildId).name}`);
        let dB = await this.fetchData(guildId);
        dB.users.forEach(user => {
            user.cooldown = false;
        });
        await this.saveDB(dB,guildId);
    },
    async getServerStats(guildId){
        startTime = Date.now();
        let dB = await this.fetchData(guildId);
        let xp = 0;
        dB.users.forEach(user =>{
            xp += user.xp;
        });
        console.log(`Time to Complete: ${Date.now() - startTime}ms`);
        return xp;
    },
    async sortForLeaderboard(guildId){
        let dB = await this.fetchData(guildId);
        allTotalArray = [];
        startTime = Date.now();
        dB.users.forEach(user => {
            leaderUser = {"username": user.username, "level":user.level};
            allTotalArray.push(leaderUser);
        });
        finalArray = allTotalArray.sort(function(a,b) {
            return b.level-a.level;
        });
        console.log(`Took ${Date.now()-startTime}ms`)
        return finalArray;
    },
    async calculateNextLevel(id,guildId){
        let dB = await this.fetchData(guildId);
        user = await this.fetchUser(id,true,guildId);
        startingXp = 500 * dB.nextLevelXpMulti;
        console.log(startingXp);
        nextLevelXPReq = startingXp * user.level;
        return nextLevelXPReq;
    },
    async levelUpUser(id,guildId){
        let dB = await this.fetchData(guildId);
        [users,userIndex] = await this.fetchUser(id,false,guildId);
        dB.users[userIndex].level++;
        await this.saveDB(dB,guildId);
    },
    async getUserLevel(id,guildId){
        user = await this.fetchUser(id,true,guildId);
        console.log(user);
        nextLevel = await this.calculateNextLevel(id,guildId);
        return [user.level, user.xp, nextLevel];   
    },
    async setMultiplier(xpMulti,op,guildId){
        let db = await this.fetchData(guildId);
        if(typeof op === 'undefined' || typeof op !== 'string'){
            op = "=";
        }
        switch(op){
            case '+':
                db.xpMultiplier += xpMulti;
                break;
            case '*':
                db.xpMultiplier *= xpMulti;
                break;
            case '/':
                db.xpMultiplier /= xpMulti;
                break;
            case '-':
                db.xpMultiplier -= xpMulti;
                break;
            case '=':
            default:
                db.xpMultiplier = xpMulti;
                break;
        }
        await this.saveDB(db,guildId);
    },
    async setCooldown(seconds,guildId){
        let db = await this.fetchData(guildId);
        secondsToMS = seconds*1000;
        db.messageCooldownTime = secondsToMS;
        await this.saveDB(db,guildId);
    },
    async giveRole(user,level,guildId){
        let dB = await this.fetchData(guildId);
        levelRoles = dB.levelsRewards;
        if(levelRoles.length == 0){
            return Promise.reject("No Level Reward Roles");
        }
        for(i=0;i<levelRoles.length;i++){
            if(levelRoles[i].level <= level){
                let guild = await this.bot.guilds.cache.get(guildId);
                let role = guild.roles.cache.find(r => r.id = levelRoles[i].roleID);
                if(typeof role === 'undefined'){
                    return;
                }
                if(user.roles.cache.some(r => r.id === role.id)){console.log(`${user.user.username} already has that role`); return;}
                user.roles.add(role);
                return Promise.resolve(`Gave User: ${user.user.username} the role: ${role.name}`)
            }
        }
    },
    async setRoleReward(roleID,level,guildId){
        let db = await this.fetchData(guildId);
        if(typeof db.levelsRewards === 'undefined'){
            db.levelsRewards = [];
        }
        if(db.levelsRewards.some(reward => reward.level == level)){
            roleIndex = db.levelsRewards.findIndex(reward => reward.level === level);
            db.levelsRewards[roleIndex].roleID == roleID;
        } else {
            db.levelsRewards.push({"roleID":roleID,"level": level});
        }
        await this.saveDB(db, guildId);
        Promise.resolve(`Saved role reward for: ${roleID} at lvl ${level}`);
    },
    async removeRoleReward(level,guildId){
        let db = await this.fetchData(guildId);
        if(typeof db.levelsRewards === 'undefined'){
            return;
        }
        roleIndex = db.levelsRewards.findIndex(reward => reward.level === level);
        db.levelsRewards.splice(roleIndex,1);
        await this.saveDB(db,guildId);
        return Promise.resolve();
    }
}
