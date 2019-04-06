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

// 节流
function throttling(callback, delay = 500) {
    let timeout;

    return function () {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            callback.apply(this, arguments);
        }, delay);
    };
}

module.exports = {
    loadFile,
    throttling
};