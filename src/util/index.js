const fs = require('fs');

function loadFile(filepath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, 'utf8', (err, res) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(res);
        });
    });
}

function loadDirectory(filepath) {
    return new Promise((resolve, reject) => {
        // fs.readdir()
    });
}

module.exports = {
    loadFile
};