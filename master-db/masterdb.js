const { dir } = require('console');
const fs = require('fs');
const os = require('os');
const { resolve } = require('path');
masterdb = module.exports = {
    folderDirection(){ // Used to automatically detect linux or windows type filesystems to automatically adjust for file searching differences 
        if(this.platform != 'win32'){
            return '/';
        } else {
            return '\\'; // with JS double back slash is pretty much just one back slash for anything using it
        }
    },
    /**
    * ASYNC Function to Grab a Guild/Server's JSON File
    * @param {string} GuildID The Guilds ID as a String to grab data from
    * @param {string} fileName The File to read from, Common Files: config,items,jackpot,points-db | DO NOT INCLUDE .JSON at the end, this is handled automatically 
    * @returns {Promise}  Returns an Object Promise if it was able to find the file
    */
    getGuildJson: async function(id,fileName){
        guildDir = __dirname+this.folderDirection()+id;
        //console.log(guildDir);
        if(!fs.existsSync(guildDir)){
            fs.mkdirSync(guildDir);
            return Promise.reject("No Dir, Creating");
        } else {
            contents = fs.readdirSync(guildDir);
            //console.log(contents);
            let file;
            for(i=0;i<contents.length;i++){
                //console.log(contents[i]);
                if(contents[i] == `${fileName}.json`){
                    file = JSON.parse(fs.readFileSync(guildDir+this.folderDirection()+contents[i]));
                    //console.log(file);
                }
            }
            //console.log(file);
            if(typeof file !== 'object') {return Promise.reject(`No ${fileName}`)};
            return new Promise(resolve => {
                    resolve(file);
            },1000);
        }
    },
    /**
    * ASYNC Function to Write to a JSON file for A guild, will create the directory or file automatically if its not present
    * @param {string} GuildID The Guilds ID as a String to grab data from
    * @param {string} fileName The File to write to, Common Files: config,items,jackpot,points-db | DO NOT INCLUDE .JSON at the end, this is handled automatically 
    * @param {Object} data JS Array Object to Write to the JSON file DO NOT PRE STRINGIFY THIS IS HANDLED IN THE FUNCTION
    * @returns {Promise}  Returns a Promise
    */
    async writeGuildJsonFile(id,filename,data){
        guildDir = __dirname+this.folderDirection()+id;
        //console.log(guildDir);
        if(!fs.existsSync(guildDir)){
            fs.mkdirSync(guildDir);
            console.log(guildDir,data,filename);
            fs.writeFileSync(guildDir+this.folderDirection()+filename+".json",JSON.stringify(data), function(err){
                if(err){
                    return Promise.reject(err);
                }
            });
            console.log(`Saved File: ${filename}.json`);
            return Promise.resolve(`File was Created and Saved`);
        } else {
            guildDir = __dirname+this.folderDirection()+id;
            fs.writeFileSync(guildDir+this.folderDirection()+filename+".json",JSON.stringify(data), function(err){
                
                if(err){
                    return Promise.reject(err);
                }
            });
            console.log(`Saved File: ${filename}.json`);
            return Promise.resolve(`File was Created and Saved`);
        }
    },
    /**
    * ASYNC Function To Check if A File Exists
    * @param {string} GuildID The Guilds ID as a String to grab data from
    * @param {string} fileName The File to read from, Common Files: config,items,jackpot,points-db | DO NOT INCLUDE .JSON at the end, this is handled automatically 
    * @returns {boolean}  Returns a Boolean
    */
    async DoesFileExist(id,filename){
        guildDir = __dirname+this.folderDirection()+id;
        //console.log(guildDir);
        found = false;
        if(!fs.existsSync(guildDir)){
            return Promise.reject("No DIR At all");
        } else {
            contents = fs.readdirSync(guildDir);
            if(contents.length > 1){
                for(i=0;i<contents.length;i++){
                    if(contents[i] == `${filename}.json`){
                        found = true;
                    }
                }
            } else if(contents.length == 1){
                if(contents[0] == `${filename}.json`){
                    found = true;
                }
            } else {
                found = false;
            }
        }
        return Promise.resolve(found);
    }
}
async function Example(){ // example function
    masterdb.getGuildJson("631008739830267915","config").then((file) => {
        console.log(file);
    }).catch((err) =>{
        console.log(err);
    });
    // or
    JSONfile = await masterdb.getGuildJson("631008739830267915","config");
}