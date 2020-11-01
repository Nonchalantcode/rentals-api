const fs = require('fs')
const path = require('path')

const UPDATES_FILE = path.resolve('logs', 'updates.txt')

const info = (...args) => {
    if(process.env.NODE_ENV !== 'test') {
        console.log(...args)
    }
}

const error = (...params) => {
    console.error(...params)
}

function logUpdates(info) {
    fs.appendFile(UPDATES_FILE, info, err => {
        if(err) {
            error("Something went wrong while trying to write to the update.txt log file")
        }
    })
}

module.exports = {
    info, error, logUpdates
}
