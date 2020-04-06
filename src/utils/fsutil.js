const fs = require('fs');
const path = require('path');
let fsutil = {}

fsutil.ensureDirectoryExistence = function(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    fsutil.ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

module.exports = fsutil