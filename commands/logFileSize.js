const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json');
const pglibrary = require("../libraryfunctions");
const fs = require('fs');
module.exports = {
    name: 'logsize',
    description: `Debug thing`,
    args: 'N/A',
    active: true,
    admin:true,
    execute(message, args, bot){
        try{
            logFile = fs.statSync(`./${config.logfileName}`);
            message.channel.send(`Log File Size: ${logFile.size / (1024*1024)}MB`);
        } catch {
            message.channel.send("No Log File Found");
        }
    }
}
