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
    setBot: function(bot){ // funky work around 
        manager.bot = bot;
    },
    getBot(){ // trying to access the var directly has some weird issues sometimes
        return this.bot;
    },
    async giveUserData(id, amount, bool,guildId){
        let user = await masterdb.getUser(guildId,id)
        let dB = await masterdb.getGuildConfig(guildId)
        if(isNaN(amount)){
            err = 'Given XP/Level is not a number';
            return err;
        }
        if(bool){ // to give xp or level
            user.xp += amount;
            await masterdb.editUserValue(guildId,id,"xp",user.xp)
        } else {
            user.level += amount;
            await masterdb.editUserValue(guildId,id,"level",user.level)
            await this.giveRole(message.member, user.level,guildId).then((status) => {console.log(status)}).catch((err) => {console.error(err); return;});
        }
        if(user.xp >= await this.calculateNextLevel(id,guildId) && bool){
            await this.giveRole(message.member, dB.users[userIndex].level++,guildId).then((status) => {console.log(status)}).catch((err) => {console.error(err); return;});;
            await this.levelUpUser(id);
            message.channel.send(`<@${message.author.id}>, You have leveled up to Level ${dB.users[userIndex].level++}!`);
        }
        //pglibrary.EconChannelLog(`User ${id} has been given/removed ${pglibrary.commafy(amount)} points`, 'Command', this.bot);
    },
    async setUserData(id, amount, bool,guildId){
        let user = await masterdb.getUser(guildId,id)
        let dB = await masterdb.getGuildConfig(guildId)
        if(isNaN(amount)){
            err = 'Given XP/Level is not a number';
            return err;
        }
        if(bool){
            user.xp += amount;
            await masterdb.editUserValue(guildId,id,"xp",user.xp)
            //pglibrary.EconChannelLog(`User ${id} xp has been set to ${pglibrary.commafy(users[userIndex].xp += amount)}.`, `Admin Command`, this.bot);
        } else {
            user.level = amount;
            user.xp = 500 * dB.nextLevelXpMulti * amount;
            await masterdb.editUserValue(guildId,id,"xp",user.xp)
            await masterdb.editUserValue(guildId,id,"level",user.level)
            //pglibrary.EconChannelLog(`User ${id} level has been set to ${pglibrary.commafy(amount)}.`, `Admin Command`, this.bot);
        }
        return Promise.resolve(`Saved User Data for: ${id}`);
    },
    async messageXP(id,message,guildId){
        let dB = await masterdb.getGuildConfig(guildId)
        let user = await masterdb.getUser(guildId,id)
        if (user == undefined){
            return;
        }
        if(user.cooldown == 1){
            console.log(`${id} is on cooldown`);
            return;
        }
        console.log(`Giving User: ${id}, ${dB.xpPerMessage} xp`);
        user.xp += dB.xpPerMessage * dB.xpMultiplier;
        await masterdb.editUserValue(guildId,id,"xp", user.xp);
        await masterdb.editUserValue(guildId,id,"cooldown", 1);
        if(user.xp >= await this.calculateNextLevel(id,guildId)){
            await this.giveRole(message.member, user.level++,guildId).then((status) => {console.log(status)}).catch((err) => {console.error(err); return;});
            await this.levelUpUser(id,guildId);
            message.channel.send(`<@${message.author.id}>, You have leveled up to Level ${user.level}!`);
        }
    },
    async sortForLeaderboard(guildId){
        let users = await masterdb.getAllUsers(guildId)
        allTotalArray = [];
        startTime = Date.now();
        users.forEach(user => {
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
        let dB = await masterdb.getGuildConfig(guildId)
        user = await masterdb.getUser(guildId,id)
        startingXp = dB.xpForLevelUp * dB.nextLevelXpMulti;
        nextLevelXPReq = startingXp * (user.level + 1);
        return nextLevelXPReq;
    },
    async levelUpUser(id,guildId){
        let user = await masterdb.getUser(guildId,id)
        await masterdb.editUserValue(guildId, id, "level", user.level++)
    },
    async getUserLevel(id,guildId){
        user = await masterdb.getUser(guildId,id)
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
        await masterdb.editGuildValue(guildId, "xpMultiplier", db.xpMultiplier)
    },
    async giveRole(user,level,guildId){
        let dB = await masterdb.getGuildConfig(guildId)
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
        let db = await masterdb.getGuildConfig(guildId)
        if(db.levelsRewards.some(reward => reward.level == level)){
            roleIndex = db.levelsRewards.findIndex(reward => reward.level === level);
            db.levelsRewards[roleIndex].roleID == roleID;
        } else {
            db.levelsRewards.push({"roleID":roleID,"level": level});
        }
        await masterdb.editGuildValue(guildId, "levelsRewards",db.levelsRewards)
        Promise.resolve(`Saved role reward for: ${roleID} at lvl ${level}`);
    },
    async getRoleRewards(guildId){
        let dB = await masterdb.getGuildConfig(guildId)
        return dB.levelsRewards
    },
    async removeRoleReward(level,guildId){
        let db = await masterdb.getGuildConfig(guildId)
        roleIndex = db.levelsRewards.findIndex(reward => reward.level === level);
        db.levelsRewards.splice(roleIndex,1);
        await masterdb.editGuildValue(guildId,"levelsRewards", db.levelsRewards)
    },
    async getRoleReward(level, guildId, bot){
        let db = await masterdb.getGuildConfig(guildId)
        level = parseInt(level)
        roleIndex = db.levelsRewards.findIndex(reward => reward.level === level);
        console.log(roleIndex)
        if (db.levelsRewards[roleIndex] === undefined){
            return null
        }
        return bot.guilds.cache.get(guildId).roles.cache.get(db.levelsRewards[roleIndex].roleID)
    }
}
