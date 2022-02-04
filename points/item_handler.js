const config = require('../config.json'); // basic load of config file
const fs = require('fs'); // File System for JS
const pglibrary = require("../libraryfunctions.js");
const points_manager = require('./manager');
const {MessageEmbed, Message} = require('discord.js');
const os = require('os');
var item_handler = module.exports = {
    platform: os.platform(),
    folderDirection(){ // Used to automatically detect linux or windows type filesystems to automatically adjust for file searching differences 
        if(this.platform != 'win32'){
            return '/';
        } else {
            return '\\'; // with JS double back slash is pretty much just one back slash for anything using it
        }
    },
    fetchItems(){
        this.dir = __dirname;
        console.log(this.dir);
        return JSON.parse(fs.readFileSync(this.dir + this.folderDirection() +'items.json'));
    },
    fetchItem(name,bool){
        if(!name){
            err = "Not Name Provided";
            return err;
        }
        dB = this.fetchItems();
        for(i=0;i<dB.length;i++){
            if(dB[i].name == name){
                if(bool){
                    return dB[i];
                } else{
                    return [dB, i];
                }
            } else {
                err ='Could Not Find Item';
                return err;
            }
        }
    },
    saveDB(newData){
        this.dir = __dirname;
        console.log(this.dir);
        pglibrary.WriteToJson(newData, `${this.dir + this.folderDirection()}` +'items.json');
    },
    createItem(message,args){
        dB = this.fetchItems();
        if(args[0] && args[1]){
            itemName =  args[0].replaceAll('_', " ");
            for(i=0;i<dB.length;i++){
                if(dB[i].name == itemName){
                    err = "An Item with this name already exists";
                    return err;
                }
            }
            cost = parseInt(args[1]);
            item = {
                "name": itemName,
                "price": cost
            }
            if(args[2]){
                switch(args[2]){
                    case 'Role':
                    case 'role':
                        item.type = 'role';
                        item.typeParam = args[3];
                        break;
                }
            }
            dB.push(item);
            this.saveDB(dB);
            return item;
        } else {
            err = "Valid Args: Name | Cost | Type (Optional) | Type Option (Optional)";
            return err;
        }
    },
    deleteItem(message,args){
        if(args[0]){
            itemName =  args[0].replaceAll('_', " ");
            err = this.fetchItem(itemName);
            console.log(err);
            if(typeof err === 'string'){
                return err;
            }
            [items, index] = this.fetchItem(itemName);
            console.log(items, index)
            if(typeof items === 'object'){
                console.log(items[index], itemName);
                if(items[index].name == itemName){
                    console.log(`Item to Delete: ${itemName}`);
                    items.splice(i, 1);
                    this.saveDB(items);
                }
            }
        }
    }
}
