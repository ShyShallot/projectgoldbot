const fs = require('fs');
const pglibrary = require('./libraryfunctions');
const point_handler = require('./points/manager');
const os = require('os');
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
    replacePlaceholder(type,amount){
        return new Promise(async function (res,rej){
            strings = handler.fetchStrings(type);
            if(strings == 'No Type'){
                rej('No Type Found');
                return 
            }
            console.log(strings.length);
            randomString = strings[pglibrary.getRandomInt(strings.length)];
            count = (randomString.match(/$random/g) || []).length;
            console.log(count);
            if(count >= 1){
                for(i=0;i<count;i++){
                    randomAmount = pglibrary.getRandomInt(10);
                    console.log(randomAmount);
                    randomString = randomString.replace('$random', `${randomAmount}`);
                    console.log(randomString);
                }
            }
            dB = point_handler.fetchData();
            console.log(dB.pointSymbol);
            randomString = randomString.replace('$symbol', dB.pointSymbol.toString());
            console.log(randomString);
            randomString = randomString.replace('$amount', `${pglibrary.commafy(amount)}`);
            res(randomString);
        });
    }
}