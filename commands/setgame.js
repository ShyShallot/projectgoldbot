const config = require('../config.json');
const Discord = require('discord.js');
const fs = require('fs');
const pglibrary = require('../libraryfunctions');
module.exports = {
    name: 'setgame',
    description: 'Set the Bots Current Game, Owner Only',
    args: 'Game Name',
    active: true,
    admin: true,
    execute(message, args, bot){
        if(message.author.id != config.ownerID){
            message.channel.send("You don't have perms to do that")
            return;
          } else{
            let messagecontent = message.content.substring(message.content.indexOf(" ") + 1, message.content.length);
            bot.user.setActivity(messagecontent, {type: 'PLAYING'}); // Set our game status
            config.game = messagecontent;
            pglibrary.WriteToJson(config, './config.json');
            message.channel.send("Game Set and config.json saved successfully.")
            console.log("The File was saved");
          }
  }
}