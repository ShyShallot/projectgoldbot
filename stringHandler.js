const fs = require('fs');
const lib = require('./libraryfunctions');
const os = require('os');
const point_handler = require('./points/manager');
const masterdb = require('./master-db/masterdb');
const handler = module.exports = {
    dir: null,
    platform: os.platform(),
    folderDirection(){ // Used to automatically detect linux or windows type filesystems to automatically adjust for file searching differences 
        if(this.platform != 'win32'){
            return '/';
        } else {
            return '\\'; // with JS double back slash is pretty much just one back slash for anything using it
        }
    },
    fetchStrings(type){
        this.dir = __dirname,
        strings = JSON.parse(fs.readFileSync(this.dir + this.folderDirection() + 'RandomStrings.json'));
        switch (type){
            case 'work':
                return strings.workStrings;
                break;
            case 'crime':
                return strings.crimeStrings;
                break;
            case 'fail':
                return strings.failStrings;
                break;
            case 'all':
                return strings;
                break;
            default:
                return 'No Type';
        }
    },
    replacePlaceholder(type,amount,guildId){
        return new Promise(async function (res,rej){
            strings = handler.fetchStrings(type);
            if(strings == 'No Type'){
                rej('No Type Found');
                return;
            }
            console.log(strings.length);
            if(strings.length == 0){
                rej('No Strings for that Category');
                return;
            }
            randomString = strings[lib.getRandomInt(strings.length)];
            console.log(randomString);
            count = (randomString.match(/Srandom/g) || []).length;
            console.log(count);
            if(count >= 1){
                for(i=0;i<count;i++){
                    console.log(`Srandom Index: ${i}`);
                    randomAmount = lib.getRandomInt(10+i);
                    console.log(`Random Amount: ${randomAmount}`);
                    randomString = randomString.replace('Srandom', `${randomAmount}`);
                    console.log(randomString);
                }
            }
            dB = await masterdb.getGuildConfig(guildId)
            console.log(dB.point_symbol);
            randomString = randomString.replace('$symbol', dB.point_symbol.toString());
            console.log(randomString);
            randomString = randomString.replace('$amount', `${lib.commafy(amount)}`);
            res(randomString);
        });
    }
}