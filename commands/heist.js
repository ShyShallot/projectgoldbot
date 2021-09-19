const {MessageEmbed} = require('discord.js'); // required for Rich Message Embeds
const config = require('../config.json'); // basic config file read
const { Client } = require('unb-api'); // define our basic client for the UNB-API
const client = new Client(config.econtoken); // define the rest of the client for economy and verify with our econ token
const pglibrary = require("../libraryfunctions.js"); // load our custom library functions.
const fs = require('fs'); // File System for JS 
module.exports = {
    name: 'heist',
    description: 'Heist System',
    execute(message, args, bot){

        switch (args[0]){
            case 'list':
                ListHeistLocations(message, args, bot);
                break;
            case 'start':
                // todo
                break;
            case 'status':
                //todo
                break;
            default: 
                message.channel.send(`<@${message.author.id}>, please provide a valid argument of start/status/list.`);
                break;
        }
    }
}

function HeistData(){
    heistlocationdata = fs.readFileSync('./heists/locations.json');
    heistlocations = JSON.parse(heistlocationdata);
    return heistlocations;
}

function ListHeistLocations(message, args, bot){
    heistlocations = HeistData();
    if (!args[1]){
        let embed = new MessageEmbed()
        .setTitle(`Heist Location Information`)
        .setAuthor(bot.user.username, bot.user.displayAvatarURL)
        .setColor(`#87a9ff`)
        .setDescription(`Current Heist Location Information.`)
        .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot")
        heistlocations.locations.forEach(location => {
            console.log(location);
            embed.addField(location.name, `Run the List Command with the name of the location for more info`);
        });
        message.channel.send({content: `<@${message.author.id}>`, embeds: [embed]});
    } else {
        if(args[2]) { // hacky fucking solution for detecting multiple strings into one 
            args[1] += " " + args[2]
        } 
        if(args[3]){
            args[1] += " " + args[3]
        }
        console.log(args[1]);
        for (i = 0, l = heistlocations.locations.length; i < l; i++){
            curlocation = heistlocations.locations[i];
            if(curlocation.name == args[1]) {
                if(curlocation.available == 1){
                    locationavail = "Available for Heist"
                } else {
                    locationavail = "Not Available for Heist"
                }
                let embed = new MessageEmbed()
                .setTitle(`Heist Location Information`)
                .setAuthor(bot.user.username, bot.user.displayAvatarURL)
                .setColor(`#87a9ff`)
                .setDescription(`Current Heist Location Information.`)
                .setFooter("Made by ShyShallot: https://github.com/ShyShallot/projectgoldbot")
                .addField(`Name`, `${curlocation.name}`)
                .addField(`Description`, `${curlocation.description}`)
                .addField(`Location Difficulty`, `${curlocation.difficulty}`)
                .addField(`Max Possible Reward Outcome`, `$${pglibrary.commafy(curlocation.maxreward)}`)
                .addField('Required Equipment', `${curlocation.reqs}`)
                .addField(`Optional Equipment`, `${curlocation.optionalreqs}`)
                .addField(`Location Availability`, `${locationavail}`)
                message.channel.send({content: `<@${message.author.id}>`, embeds: [embed]});
            }
        }
    }
}