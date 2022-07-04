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
        return JSON.parse(fs.readFileSync(this.dir + this.folderDirection() +'level-db.json'));
    },
    saveDB(newData){
        this.dir = __dirname;
        pglibrary.WriteToJson(newData, `${this.dir + this.folderDirection()}level-db.json`);
    },
    /**
    * Writes JS Object data to a JSON File
    * @param {number} userID Provide the User's ID
    * @param {boolean} true_false If True returns the user Object for read only purposes else returns the users Array with the users Index
    * @returns {number|Object}  Returns user Object if true_false is true else returns [userArray, userIndex];
    */
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
            "xp": 0,
            "level":1,
            "id": user.id,
            "username": user.username, 
            "cooldown": false,
        }
        return newUserData;
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
        if(dB.setup){ // to clear any message cooldowns on startup but only if we have setup before
            users = dB.users;
            if(users.length <= 0){return;}
            for(i=0;i<users.length;i++){
                this.removeUserCooldown(users[i].id);
            }
        }
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
            pglibrary.EconChannelLog('The Server Levelonomy has been reset', 'Admin Forced', this.bot);
        } else {
            pglibrary.EconChannelLog('Server Levelonomy has been setup', 'Automated On Start Up', this.bot);
        }
    },
    giveUserData: function(id, amount, bool){
        let [users, userIndex] = this.fetchUser(id);
        let dB = this.fetchData();
        if(isNaN(amount)){
            err = 'Given XP/Level is not a number';
            return err;
        }
        if(bool){
            users[userIndex].xp += amount;
        } else {
            users[userIndex].level += amount;
            this.giveRole(message.author, users[userIndex].level++);
        }
        if(users[userIndex].xp >= this.calculateNextLevel(id) && bool){
            this.giveRole(message.author, users[userIndex].level++);
            this.levelUpUser(id);
            message.channel.send(`<@${message.author.id}>, You have leveled up to Level ${users[userIndex].level++}!`);
        }
        dB.users = users;
        this.saveDB(dB);
        pglibrary.EconChannelLog(`User ${id} has been given/removed ${pglibrary.commafy(amount)} points`, 'Command', this.bot);
    },
    setUserData: function(id, amount, bool){
        let [users, userIndex] = this.fetchUser(id);
        let dB = this.fetchData();
        if(isNaN(amount)){
            err = 'Given XP/Level is not a number';
            return err;
        }
        if(bool){
            users[userIndex].xp += amount;
        } else {
            users[userIndex].level = amount;
        }
        dB.users = users;
        this.saveDB(dB);
        pglibrary.EconChannelLog(`User ${id} points have been set to ${pglibrary.commafy(points)}.`, `Admin Command`, this.bot);
    },
    messageXP(id,message){
        dB = this.fetchData();
        try{
            [users, userIndex] = this.fetchUser(id);
            console.log(users[userIndex]);
            if(!users[userIndex].cooldown){
                console.log(`Giving User: ${id}, ${dB.xpPerMessage} xp`);
                users[userIndex].xp += dB.xpPerMessage;
                users[userIndex].cooldown = true;
                if(users[userIndex].xp >= this.calculateNextLevel(id)){
                    this.giveRole(message.author, users[userIndex].level++);
                    this.levelUpUser(id);
                    message.channel.send(`<@${message.author.id}>, You have leveled up to Level ${users[userIndex].level++}!`);
                }
                dB.users = users;
                this.saveDB(dB);
                setTimeout(this.removeUserCooldown(id), db.messageCooldownTime);
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
    getServerStats(){
        startTime = Date.now();
        dB = this.fetchData();
        let xp = 0;
        dB.users.forEach(user =>{
            xp += user.xp;
        });
        console.log(`Time to Complete: ${Date.now() - startTime}ms`);
        return xp;
    },
    sortForLeaderboard(){
        userDB = this.fetchData().users;
        allTotalArray = [];
        startTime = Date.now();
        userDB.forEach(user => {
            leaderUser = {"username": user.username, "level":user.level};
            allTotalArray.push(leaderUser);
        });
        finalArray = allTotalArray.sort(function(a,b) {
            return b.level-a.level;
        });
        console.log(`Took ${Date.now()-startTime}ms`)
        return finalArray;
    },
    calculateNextLevel(id){
        dB = this.fetchData();
        user = this.fetchUser(id,true);
        startingXp = 500 * dB.nextLevelXpMulti;
        nextLevelXPReq = startingXp * user.level;
        return nextLevelXPReq;
    },
    levelUpUser(id){
        dB = this.fetchData();
        [users,userIndex] = this.fetchUser(id);
        users[userIndex].level++;
        dB.users = users;
        this.saveDB(dB);
    },
    getUserLevel(id){
        user = this.fetchUser(id,true);
        console.log(user);
        nextLevel = this.calculateNextLevel(id);
        return [user.level, user.xp, nextLevel];   
    },
    setMultiplier(xpMulti,op){
        db = this.fetchData();
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
        this.saveDB(db);
    },
    setCooldown(seconds){
        db = this.fetchData();
        secondsToMS = seconds*1000;
        db.messageCooldownTime = secondsToMS;
        this.saveDB(db);
    },
    giveRole(user,level){
        dB = this.fetchData();
        levelRoles = dB.levelsRewards;
        if(levelRoles.length == 0){
            return;
        }
        for(i=0;i<levelRoles.length;i++){
            if(levelRoles[i].level <= level){
                let role = message.guild.roles.cache.find(r => r.id = levelRoles[i].roleID);
                if(typeof role === 'undefined'){
                    return;
                }
                user.roles.add(role);
            }
        }
    },
    setRoleReward(roleID,level){
        db = this.fetchData();
        filled = false;
        for(i=0;i<db.levelsRewards.length;i++){
            if(db.levelsRewards[i].level == level){
                filled = true;
            }
        }
        if(!filled){
            db.levelsRewards.push({"roleID":roleID,"level": level});
        }
        this.saveDB(db);
    },
    removeRoleReward(level){
        db = this.fetchData();
        for(i=0;i<db.levelsRewards.length;i++){
            if(db.levelsRewards[i].level = level){
                db.levelsRewards.splice(i,1);
            }
        }
        this.saveDB(db);
    }
}
