const bot = require('../mainbotfile');
const pglibrary = require('../libraryfunctions');
const masterdb = require('../master-db/masterdb');
module.exports = {
    async fileHandler(state){
        switch(state,guildId,data){
            case 'save':
                await masterdb.writeGuildJsonFile(guildId,'punishment',data);
                return Promise.resolve(`File Saved`);
            case 'read':
                fileState = await masterdb.doesFileExist(guildId,'punishment');
                if(!fileState){
                    file = {warns:[],bans:[],muted:[]}
                    await masterdb.writeGuildJsonFile(guildId,'punishment',file);
                    return Promise.resolve(file);
                }
                dB = await masterdb.getGuildJson(guildId,'punishment');
                return Promise.resolve(dB);
        }
    },
    async banUser(member,guildId,reason,length){
        dB = await this.fileHandler('read');
        if(dB.bans.some(user => user.id === member.user.id)){
            return Promise.reject('User is already banned');
        }
        dB.bans.push({id:member.user.id,banned:Date.now(),reason:reason,length:length});
        member.ban();
    },
    async muteUser(member,guildId,reason,length){
        guildConfig = await masterdb.getGuildJson(guildId,'config');
        dB = await this.fileHandler('read');
        mutedUser = dB.muted.find(user => user.id === member.user.id);
        if(typeof mutedUser !== 'undefined'){
            mutedIndex = dB.muted.findIndex(user => user.id === mutedUser.id);
            dB.muted[mutedIndex].length = length;
        } else {
            file = {id:member.user.id,muted:Date.now(),length:length,reason:reason};
            dB.muted.push(file);
        }
        mutedRole = member.guild.roles.cache.find(role => role.name.toLowerCase() === "muted");
        if(typeof mutedRole === 'undefined'){
            return Promise.reject(`NO MUTED ROLE`);
        }
        member.roles.add(mutedRole);
        return Promise.resolve(`Gave User ${member.user.username} the role ${mutedRole}`);
    }
}