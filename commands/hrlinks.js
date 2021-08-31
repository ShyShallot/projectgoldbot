const Discord = require('discord.js');
const config = require('../config.json');
module.exports = {
    name: 'hrlinks',
    description: 'links all things related to HR',
    execute(message, args, bot){
        message.channel.send("**Current Links for HR: \n https://docs.google.com/spreadsheets/d/1_5OTYyHILD5mAeAGemYBYDFR3E-ZP7bDYfPPn2U8OCM/edit?usp=sharing - Public Mod Pipeline \n https://steamcommunity.com/sharedfiles/filedetails/?id=1886416517 - Steam Page \n https://www.moddb.com/mods/humanitys-retaliation - Mod DB Page \n Project Gold Website: https://www.projectgold.dev/**")
  }
}