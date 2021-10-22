const config = require('../config.json');
const Discord = require('discord.js');
const fs = require('fs');
module.exports = {
    name: 'setgame',
    description: 'owner only',
    execute(message, args, bot){
        if(message.author.id != config.ownerID){
            message.channel.send("You don't have perms to do that")
            return;
          } else{
            let messagecontent = message.content.substring(message.content.indexOf(" ") + 1, message.content.length);
            bot.user.setActivity(messagecontent, {type: 'PLAYING'}); // Set our game status
           fs.writeFile("./game.json", JSON.stringify(messagecontent), 'utf8', function(err){
             if(err){
               return console.log(err);
             }
             message.channel.send("Game Set and game.json saved successfully.")
             console.log("The File was saved");
           });
          }
  }
}