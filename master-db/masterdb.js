const fs = require('fs').promises;
const path = require('path');

const baseDir = path.join(__dirname, 'database');

const masterdb = module.exports = {
  folderDirection() {
    return process.platform === 'win32' ? '\\' : '/';
  },

  async getGuildJson(id, fileName) {
    const guildDir = path.join(baseDir, id);

    try {
      await fs.mkdir(guildDir, { recursive: true });
    } catch (err) {
      throw new Error('Error creating directory');
    }

    const file = path.join(guildDir, `${fileName}.json`);
    console.log(file);

    try {
      const data = await fs.readFile(file, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      throw new Error(`No ${fileName}`);
    }
  },

  async writeGuildJsonFile(id, filename, data) {
    const guildDir = path.join(baseDir, id);
    const file = path.join(guildDir, `${filename}.json`);

    try {
      await fs.mkdir(guildDir, { recursive: true });
      await fs.writeFile(file, JSON.stringify(data));
    } catch (err) {
      throw new Error('Error writing to the file');
    }

    console.log(`Saved File: ${filename}.json`);
  },

  async doesFileExist(id, filename) {
    const guildDir = path.join(baseDir, id);
    const file = path.join(guildDir, `${filename}.json`);

    try {
      await fs.access(file);
      return true;
    } catch (err) {
      return false;
    }
  }
};


async function Example(){ // example function
    masterdb.getGuildJson("631008739830267915","config").then((file) => {
        console.log(file);
    }).catch((err) =>{
        console.log(err);
    });
    // or
    JSONfile = await masterdb.getGuildJson("631008739830267915","config");
}