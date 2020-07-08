let inMemory = {}


inMemory.store = {}

/**
 * Reads a file
 * @param location The location where to read from
 */
inMemory.read = async function (location) {
    return inMemory.store[location].content
}


/**
 * Writes to file
 * @param location The location where to write
 * @param content The content what to write
 */
inMemory.write = async function (location, content) {
    inMemory.store[location] = {
        content,
        time: Date.now()
    }
}

/**
 * Returns the modified time of a given file
 * @param location The file locator e.g. './config/config.json'
 */
inMemory.time = async function (location) {
    return inMemory.store[location].time
}

/**
 * Ensures that a given path exists 
 * @param location The path e.g. './config/'
 */
inMemory.directory = async function (location) {
    inMemory.store[location] = {
        content: null,
        time: Date.now()
    }
}


module.exports = {
    read: inMemory.read,
    write: inMemory.write,
    time: inMemory.time,
    directory: inMemory.directory
}