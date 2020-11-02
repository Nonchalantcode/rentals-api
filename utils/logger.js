const fs = require('fs')
const path = require('path')

const UPDATES_LOG = path.resolve('logs', 'updates.txt')
const PURCHASES_LOG = path.resolve('logs', 'purchases.txt')
const RENTALS_LOG = path.resolve('logs', 'rentals.txt')

const info = (...args) => {
    if(process.env.NODE_ENV !== 'test') {
        console.log(...args)
    }
}

const error = (...params) => {
    console.error(...params)
}

const logTransaction = (info, transaction = "update") => {
    let out = null
    if (transaction === 'update') {
        out = UPDATES_LOG
    } else if (transaction === 'purchase') {
        out = PURCHASES_LOG
    } else if (transaction === 'rental') {
        out = RENTALS_LOG
    }
    
    fs.appendFile(out, info, err => {
        if(err){
            error(`Something went wrong while trying to write to the ${transaction} log file`)
        }
    })
}

module.exports = {
    info, error, logTransaction,
}
