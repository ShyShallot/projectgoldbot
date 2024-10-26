const fs = require('fs'); // File System for JS
const config = require('./config.json');
const {MessageEmbed, Message} = require('discord.js');6
/**
 * Gets the digit length of any positive or negative number
 * @param {number} x Any Number 
 * @returns {number} Number of digits in a number, like 50000 would return 5
 */
function numDigits(x) { // taken from https://stackoverflow.com/a/28203456 god bless
    return (Math.log10((x ^ (x >> 31)) - (x >> 31)) | 0) + 1; 
}
/**
 * Returns a random whole intiger from 0 to max number
 * @param {number} max Max Number to go to
 * @returns {number} Randomly Generated Number
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function randomNegative(){
    let ran = Math.random();
    return (ran < 0.5 ? -1 : 1);
}

function percentage(number, percent){
    return (percent / 100)*number;
}

/**
 * Writes JS Object data to a JSON File
 * @param {Object} rawdata An Array Object
 * @param {string} location Location of a file ex: ./poop.json
 * @returns {boolean}  True if successful and vice versa
 */
async function WriteToJson(rawdata, location) {
    var final = JSON.stringify(rawdata);
    fs.writeFileSync(location, final, function(err){
        if(err){
            console.log(err);
            return Promise.reject(err);
        }
        console.log("The File was saved");
        return Promise.resolve(`File ${location} Was Saved`);
    });
    return Promise.resolve(`File ${location} Was Saved`);
}

function ReadJSON(location){
    return JSON.parse(fs.readFileSync(location,'utf-8'));
}


/**
 * 
 * @param {number} num Number to commafy
 * @returns {String} returns a string of the commafied number
 */

function commafy( num ) { // taken from https://stackoverflow.com/a/6786040
    var str = num.toString().split('.');
    if (str[0].length >= 3) {
        str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    }
    if (str[1] && str[1].length >= 3) {
        str[1] = str[1].replace(/(\d{3})/g, '$1 ');
    }
    return str.join('.');
}

/**
 * 
 * @param {number} ms 
 * @returns {Promise} Waits for set timeout in MS to be done
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * 
 * @param {number} milliseconds 
 * @returns {number} day, hour, minute, or seconds
 */
function convertMS( milliseconds ) { // from: https://gist.github.com/Erichain/6d2c2bf16fe01edfcffa
    var day, hour, minute, seconds;
    seconds = Math.floor(milliseconds / 1000);
    minute = Math.floor(seconds / 60);
    seconds = seconds % 60;
    hour = Math.floor(minute / 60);
    minute = minute % 60;
    day = Math.floor(hour / 24);
    hour = hour % 24;
    return {
        day: day,
        hour: hour,
        minute: minute,
        seconds: seconds
    };
}

function addHours(date, hours) {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
}

function NormSInv(p) {
    var a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969;
    var a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
    var b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887;
    var b4 = 66.8013118877197, b5 = -13.2806815528857, c1 = -7.78489400243029E-03;
    var c2 = -0.322396458041136, c3 = -2.40075827716184, c4 = -2.54973253934373;
    var c5 = 4.37466414146497, c6 = 2.93816398269878, d1 = 7.78469570904146E-03;
    var d2 = 0.32246712907004, d3 = 2.445134137143, d4 = 3.75440866190742;
    var p_low = 0.02425, p_high = 1 - p_low;
    var q, r;
    var retVal;

    if ((p < 0) || (p > 1))
    {
        alert("NormSInv: Argument out of range.");
        retVal = 0;
    }
    else if (p < p_low)
    {
        q = Math.sqrt(-2 * Math.log(p));
        retVal = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }
    else if (p <= p_high)
    {
        q = p - 0.5;
        r = q * q;
        retVal = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q / (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    }
    else
    {
        q = Math.sqrt(-2 * Math.log(1 - p));
        retVal = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }

    return retVal;
}

  
module.exports = {numDigits, getRandomInt, randomNegative, WriteToJson, sleep, commafy, convertMS, addHours, percentage,ReadJSON,NormSInv};