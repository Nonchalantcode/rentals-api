const fs = require('fs')
const path = require('path')

const UPDATES_LOG = path.resolve('logs', 'updates.txt')
const PURCHASES_LOG = path.resolve('logs', 'purchases.txt')

const info = (...args) => {
    if(process.env.NODE_ENV !== 'test') {
        console.log(...args)
    }
}

const error = (...params) => {
    console.error(...params)
}

function logUpdates(info) {
    fs.appendFile(UPDATES_LOG, info, err => {
        if(err) {
            error("Something went wrong while trying to write to the update.txt log file")
        }
    })
}

function logPurchases(info) {
    fs.appendFile(PURCHASES_LOG, info, err => {
        if(err){
            error("Something went wrong while trying to write to the purchases.txt log file")
        }
    })
}

module.exports = {
    info, error, logPurchases, logUpdates
}
