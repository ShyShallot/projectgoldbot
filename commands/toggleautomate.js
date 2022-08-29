const Discord = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
module.exports = {
    name: 'automsgT',
    description: 'Toggle the Automated Message for when some fuck asks for beta release',
    args: '1 or 0',
    active: true,
    admin: true,
    execute(message, args, bot){
      var data = fs.readFileSync('./automatedmessagestatus.json', 'utf-8');
      var state = JSON.parse(data);
      console.log(state.state);
      if (state.state == 1 ){
        var stateW = {
          state: "0"
        }
      } else {
        var stateW = {
          state: "1"
        }
      }
      if (stateW){
        var stateJS = JSON.stringify(stateW)
        fs.writeFile('./automatedmessagestatus.json', stateJS, err => {
          if (err) {
              console.log('Error writing file', err)
          } else {
              console.log('Successfully wrote file')
          }
        })
        var data = fs.readFileSync('./automatedmessagestatus.json', 'utf-8');
        var state = JSON.parse(data);
        message.channel.send("Automated Message Toggled. Current State: " + state.state.toString())
      }
  }
}