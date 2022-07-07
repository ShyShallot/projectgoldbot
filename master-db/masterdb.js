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
    getGuildJson: async function(id,fileName){
        guildDir = __dirname+this.folderDirection()+id;
        console.log(guildDir);
        if(!fs.existsSync(guildDir)){
            fs.mkdirSync(guildDir);
            return Promise.reject("No Dir, Creating");
        } else {
            contents = fs.readdirSync(guildDir);
            console.log(contents);
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
    async writeGuildJsonFile(id,filename,data){
        guildDir = __dirname+this.folderDirection()+id;
        //console.log(guildDir);
        if(!fs.existsSync(guildDir)){
            fs.mkdirSync(guildDir);
            fs.writeFileSync(guildDir+this.folderDirection()+filename,data, function(err){
                if(err){
                    return Promise.reject(err);
                }
                return Promise.resolve(`File was Created and Saved`);
            })
        } else {
            guildDir = __dirname+this.folderDirection()+id;
            fs.writeFileSync(guildDir+this.folderDirection()+filename,data, function(err){
                if(err){
                    return Promise.reject(err);
                }
                return Promise.resolve(`File was Created and Saved`);
            })
        }
    },
}
async function Example(){ // example function
    masterdb.getGuildJson("631008739830267915","config").then((file) => {
        console.log(file);
    }).catch((err) =>{
        console.log(err);
    });
}