const info = (...args) => {
    if(process.env.NODE_ENV !== 'test') {
        console.log(...args)
    }
}

const error = (...params) => {
    console.error(...params)
}

module.exports = {
    info, error
}
