const logInfo = (...args) => {
    if(process.env.NODE_ENV !== 'test') {

    }
}

const error = (...params) => {
    console.error(...params)
}

module.exports = {
    info, error
}
