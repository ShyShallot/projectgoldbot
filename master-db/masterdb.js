const fs = require('fs').promises;
const path = require('path');
const util = require('util')
const mysql = require('mysql2')
const mysqlpromise = require('mysql2/promise')

const sqlConfig = require('../sql.json');

const masterdb = module.exports = {

  connection: null,

  connect: async function(){
    this.connection = mysqlpromise.createPool({
      host: sqlConfig.host,
      user: sqlConfig.user,
      password: sqlConfig.password,
      database: sqlConfig.db,
      waitForConnections: true
    })

    
  },

  setup: async function(guildId, bot){
    try {

        let command = `SELECT * FROM guild_config_${guildId} WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${sqlConfig.db}' AND table_name = 'guild_config_${guildId}')`

        let db = await this.connection.execute(command)

        db = db[0][0]

        if (db.setup == 1){ // check if server has a config table
          let config = await this.getGuildConfig(guildId)
          if(typeof config.defaultRole === "string"){
            let guild = bot.guilds.cache.get(guildId);
            let role = guild.roles.cache.find(role => role.id === config.defaultRole)
            console.log("Checking if Users Levels/usernames are properly set")
            await guild.members.fetch().then(async (members) =>{ // since the cache doesnt get EVERY user we manually ask for each user in the server
              for(const member of members.values()){
                if(!member.roles.cache.has(role.id)){
                  member.roles.add(role)
                }
                let userEntry = await this.getUser(guildId, member.user.id)

                if (userEntry != undefined){
                  if (userEntry.username !== member.user.username) {
                    console.log("Old Username: " + userEntry.username + ", New: " + member.user.username)
                    this.editUserValue(guildId,member.user.id, "username", member.user.username)
                  }
                }
  
              }
            })
          }
          await this.setUserLevels(guildId, bot)

          console.log(`${guildId} is Setup`)
          return;
        }
    
      await this.createTables(guildId)

      let guild = bot.guilds.cache.get(guildId);
      let userList = await guild.members.fetch()
      for(const member of userList){
          user = member[1].user;
          if(user.bot){
              console.error(`User ${user.username} is a Bot`);
              continue;
          }
          await this.insertUserData(user,guildId)
      }

      console.log("SERVER IS SETUP")

      this.connection.execute(`UPDATE guild_config_${guildId} SET setup='1'`)

      await this.setUserLevels(guildId, bot)

    } catch (err) {
      console.error(err)
    }
  },

  createTables: async function(guildId){
    try{

      const guildConfigTableName = `guild_config_${guildId}`
      const guildUserTableName = `guild_users_${guildId}`

      const createUserTableSQL = `
          CREATE TABLE IF NOT EXISTS ${guildUserTableName} (
              user_id VARCHAR(255),
              username VARCHAR(255),
              balance_cash INT,
              balance_bank INT,
              inv TEXT,
              cooldown BOOLEAN,
              work_cooldown BOOLEAN,
              set_on_cooldown BIGINT NULL DEFAULT NULL,
              crime_cooldown BOOLEAN,
              last_crime BIGINT NULL DEFAULT NULL,
              level INT,
              xp INT
          )
      `;

      const createConfigTableSQL = `
          CREATE TABLE IF NOT EXISTS ${guildConfigTableName} (
            setup INT,
            point_symbol VARCHAR(255),
            earn_cooldown INT,
            work_cooldown_time INT,
            crime_cooldown_time INT,
            points_per_message INT,
            points_multi INT,
            points_tax INT,
            starting_balance INT,
            max_inventory_size INT,
            welcomeMessage VARCHAR(255),
            leaveMessage VARCHAR(255),
            prefix VARCHAR(255),
            mincoinbet VARCHAR(255),
            logchannel VARCHAR(255),
            welcomeChannel VARCHAR(255),
            items TEXT,
            levelsRewards TEXT,
            xpPerMessage INT,
            messageCooldownTime INT,
            xpMultiplier INT,
            nextLevelXpMulti INT,
            xpForLevelUp INT,
            adminRole TEXT,
            defaultRole TEXT,
            game TEXT,
            pointsTax INT
        )
      `;
      // Execute SQL statements to create tables
      await this.connection.execute(createConfigTableSQL)
      await this.connection.execute(createUserTableSQL)

      await this.setupGuildConfig(guildId)
    } catch (err){
      console.error(err)
    }
  },

  insertUserData: async function(user, guildId){
    try{
      const userConfig = {
        user_id: user.id,
        username: user.username,
        balance_cash: 0,
        balance_bank: 1000,
        inv: '[]',
        cooldown: false,
        work_cooldown: false,
        set_on_cooldown: null,
        crime_cooldown: false,
        last_crime: null,
        level: 1,
        xp: 500
      }

      const userData = [
        userConfig.user_id,
        userConfig.username,
        userConfig.balance_cash,
        userConfig.balance_bank,
        userConfig.inv,
        userConfig.cooldown,
        userConfig.work_cooldown,
        userConfig.set_on_cooldown,
        userConfig.crime_cooldown,
        userConfig.last_crime,
        userConfig.level,
        userConfig.xp
      ]

      const insertDataQuery = `
        INSERT INTO guild_users_${guildId} (user_id, username, balance_cash, balance_bank, inv, cooldown, work_cooldown, set_on_cooldown, crime_cooldown, last_crime, level, xp
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `;

      await this.connection.execute(insertDataQuery, userData, function(err, result){
        if (err) throw err;
        console.log("DONE")
      })

    } catch (err) {
      console.error(err)
    }
  },

  setupGuildConfig: async function(guildId){

    const guildConfig = {
      setup: 0,
      point_symbol: '💰',
      earn_cooldown: 10000,
      work_cooldown_time: 86400000,
      crime_cooldown_time: 86400000,
      points_per_message: 5,
      points_multi: 1,
      points_tax: 5,
      starting_balance: 1000,
      max_inventory_size: 10,
      welcomeMessage: 'Welcome User!',
      leaveMessage: 'Bye bye :(',
      prefix: 'pg',
      mincoinbet: '100',
      logchannel: 'LOG_CHANNEL_PLACEHOLDER',
      welcomeChannel: 'WELCOME_CHANNEL_PLACEHOLDER',
      items: '[]',
      levelsRewards: '[]',
      xpPerMessage: 10,
      messageCooldownTIme: 10000,
      xpMultiplier: 1,
      nextLevelXpMulti: 3,
      xpForLevelUp: 500,
      adminRole: null,
      defaultRole: null,
      game: "HI :3",
      pointsTax: 5

    }

    const values = [
      guildConfig.setup,
      guildConfig.point_symbol,
      guildConfig.earn_cooldown,
      guildConfig.work_cooldown_time,
      guildConfig.crime_cooldown_time,
      guildConfig.points_per_message,
      guildConfig.points_multi,
      guildConfig.points_tax,
      guildConfig.starting_balance,
      guildConfig.max_inventory_size,
      guildConfig.welcomeMessage,
      guildConfig.leaveMessage,
      guildConfig.prefix,
      guildConfig.mincoinbet,
      guildConfig.logchannel,
      guildConfig.welcomeChannel,
      guildConfig.items,
      guildConfig.levelsRewards,
      guildConfig.xpPerMessage,
      guildConfig.messageCooldownTIme,
      guildConfig.xpMultiplier,
      guildConfig.nextLevelXpMulti,
      guildConfig.xpForLevelUp,
      guildConfig.adminRole,
      guildConfig.defaultRole,
      guildConfig.game,
      guildConfig.pointsTax
  ];

    const insertDataQuery = `
        INSERT INTO guild_config_${guildId} (setup, point_symbol, earn_cooldown, work_cooldown_time, crime_cooldown_time, points_per_message, points_multi, points_tax, starting_balance, max_inventory_size, welcomeMessage, leaveMessage, prefix, mincoinbet, logchannel, welcomeChannel, items, levelsRewards, xpPerMessage, messageCooldownTime, xpMultiplier, nextLevelXpMulti, xpForLevelUp, adminRole, defaultRole, game, pointsTax
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
    `;

    await this.connection.execute(insertDataQuery, values, function(err, result){
      if (err) throw err;
      console.log("DONE")
    })

  },

  getGuildConfig: async function(guildId){
    const query = `
      SELECT * FROM guild_config_${guildId}
    `

    let result = await this.connection.execute(query)

    result = result[0][0]

    for(let key in result){
      if(typeof result[key] !== 'string'){
        continue;
      }
      if(result[key].startsWith('[') && result[key].endsWith(']')){
        result[key] = JSON.parse(result[key])
      }
    }

    return result
  },

  editGuildValue: async function(guildId, key, value){
    if (!this.checkIfKeyIsValid(key)){
      return
    }

    if(typeof value === 'object' && value !== null){
      value = JSON.stringify(value)
    }

    await this.connection.execute(`UPDATE guild_config_${guildId} SET ${key}='${value}'`)
    

    console.log("Done setting " + key + ", to: " + value)
  },

  getUser: async function(guildId, userId){
    const query = `
      SELECT * FROM guild_users_${guildId} WHERE user_id LIKE ${userId}
    `

    let result = await this.connection.execute(query)

    result = result[0][0]

    for(let key in result){
      if(typeof result[key] !== 'string'){
        continue;
      }
      if(result[key].startsWith('[') && result[key].endsWith(']')){
        result[key] = JSON.parse(result[key])
      }
    }

    return result
  },

  editUserValue: async function(guildId, userId, key, value){
    if (!this.checkIfKeyIsValid(key)){
      return
    }

    if(typeof value === 'object' && value !== null){
      value = JSON.stringify(value)
    }

    await this.connection.execute(`UPDATE guild_users_${guildId} SET ${key}='${value}' WHERE user_id = '${userId}'`)
    
    console.log("Done setting " + key + " to: " + value)
  },

  getAllUsers: async function(guildId){
    const query = `
      SELECT * FROM guild_users_${guildId}
    `

    let result = await this.connection.execute(query)

    result = result[0]

    for(let i=0;i<result.length;i++){
      for(let key in result[i]){
        if(typeof result[i][key] !== 'string'){
          continue;
        }
        if(result[i][key].startsWith('[') && result[i][key].endsWith(']')){
          result[i][key] = JSON.parse(result[i][key])
        }
      }
    }
    

    return result
  },

  checkIfKeyIsValid: function(key){
    valid_keys = {
      setup: true,
      point_symbol: true,
      earn_cooldown: true,
      work_cooldown_time: true,
      crime_cooldown_time: true,
      points_per_message: true,
      points_multi: true,
      points_tax: true,
      starting_balance: true,
      max_inventory_size: true,
      welcomeMessage: true,
      leaveMessage: true,
      prefix: true,
      mincoinbet: true,
      logchannel: true,
      welcomeChannel: true,
      items: true,
      levelsRewards: true,
      xpPerMessage: true,
      nextLevelXpMulti: true,
      xpForLevelUp: true,
      adminRole: true,
      defaultRole: true,
      game: true,
      pointsTax: true,
      user_id: true,
      username: true,
      balance_cash: true,
      balance_bank: true,
      inv: true,
      cooldown: true,
      work_cooldown: true,
      set_on_cooldown: true,
      crime_cooldown: true,
      last_crime: true,
      xp: true,
      level: true
    }

    return valid_keys[key]
  },

  setUserLevels: async function(guildId, bot){
    let dB = await this.getGuildConfig(guildId);
    if (dB.levelsRewards.length == 0){
      return
    }
    let guild = bot.guilds.cache.get(guildId);
    await guild.members.fetch().then(async (members) =>{ // since the cache doesnt get EVERY user we manually ask for each user in the server
        for(const member of members.values()){
          for(let i=0;i<dB.levelsRewards.length;i++){
            let reward = dB.levelsRewards[i];
            const doesUserHaveReward = member.roles.cache.some(role => role.id === reward.roleID)
            if(doesUserHaveReward){
                let user = await masterdb.getUser(guildId,member.user.id)
                if(user === undefined){continue;}
                console.log(reward.level, user.username)
                if(user.xp < (reward.level * dB.nextLevelXpMulti) * dB.xpForLevelUp){
                  await masterdb.editUserValue(guildId,member.user.id, "level",reward.level)
                  await masterdb.editUserValue(guildId,member.user.id, "xp",(reward.level * dB.nextLevelXpMulti) * dB.xpForLevelUp)
                }
            }
          }
        }
    })
  },

  resetUserData: async function(guildId,bot){

    await this.connection.execute(`TRUNCATE TABLE guild_users_${guildId}`)

    this.connection.execute(`UPDATE guild_config_${guildId} SET setup='0'`)

    await this.setup(guildId, bot)
  }
};
