const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('./manager');
const {MessageEmbed, Message} = require('discord.js');
var item_handler = module.exports = {
    fetchItems(){
        this.dir = __dirname;
        console.log(this.dir);
        return JSON.parse(fs.readFileSync(this.dir + '\\items.json'));
    },
    fetchItem(name){
        if(!name){
            err = "Not Name Provided";
            return err;
        }
        dB = this.fetchItems();
        for(i=0;i<db.length;i++){
            if(dB[i].name == name){
                return [dB, i];
            }
        }
    },
    saveDB(newData){
        this.dir = __dirname;
        console.log(this.dir);
        pglibrary.WriteToJson(newData, `${this.dir}` + '\\items.json');
    },
    createItem(message,args){
        dB = this.fetchItems();
        if(args[0] && args[1] && args[2], args[3]){
            name =  args[0].replace('_', " ");
            cost = parseInt(args[1]);
            item = {
                "name": name,
                "price": cost
            }
            switch(args[2]){
                case 'role':
                    item.func = function(){
                        role = message.guild.roles.cache.find(role => role.name == args[3]);
                        message.member.roles.add(role);
                    }
                    break;
            }
            dB.push(item);
            this.saveDB(dB);
        }
    },
    deleteItem(message,args){
        if(args[0]){
            [items, index] = this.fetchItem(args[0])
            if(typeof items === 'object'){
                items.splice(i, 1);
                this.saveDB(items);
            } else {
                message.channel.send(item);
            }
        }
    }
}
