const Discord = require('discord.js');
const config = require('../config.json');
module.exports = {
    name: 'help',
    description: 'prints help',
    execute(message, args, bot){
     var helpembed = new Discord.RichEmbed()
     .setTitle("Project Gold Help Menu")
     .setColor(0xFF4500)
     .addField("Server Info:", "Rules: \n 1. No Harassment, Racism, etc.. \n 2. Offensive Memes must be marked as spoiler (Jokes about 9/11, Holocaust, etc) and must be posted in <#635509826650243073>  \n 3. Respect staff  \n 4. No Asking for ranks/ roles \n 5. No NSFW (Porn, Gore, Hentai, Sexually Suggesting Content) \n 6. Staff have final decision \n 7. Spam / Copypastas are ONLY allowed in #spam \n 8. No Movie or Show Spoilers only after 4 month of being out")
     .addField("Bot Info: ", " My Prefix: " + config.prefix + ", \n User Commands: help, avatar, userid, rate, hrlinks \n Owner Commands: setgame")
     message.channel.send(helpembed)
    }
}