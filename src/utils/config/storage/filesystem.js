const fs = require("fs").promises
const path = require('path');

let filesystem = {}


/**
 * Reads a file
 * @param location The location where to read from
 */
filesystem.read = async function (location) {
    return await fs.readFile(location, "utf-8")
}


/**
 * Writes to file
 * @param location The location where to write
 * @param content The content what to write
 */
filesystem.write = async function (location, content) {
    await fs.writeFile(location, content)
}

/**
 * Returns the modified time of a given file
 * @param location The file locator e.g. './config/config.json'
 */
filesystem.time = async function (location) {
    return parseInt((await fs.lstat(location)).mtimeMs)
}

/**
 * Ensures that a given path exists 
 * @param location The path e.g. './config/'
 */
filesystem.directory = async function (location) {
    var dir = path.dirname(location);
    if (await fs.exists(dir)) {
      return true;
    }
    await filesystem.directory(dir);
    await fs.mkdir(dir)
}


module.exports = {
    read: filesystem.read,
    write: filesystem.write,
    time: filesystem.time,
    directory: filesystem.directory
}