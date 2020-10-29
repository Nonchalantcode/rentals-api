require('dotenv').config()

const PORT = process.env.PORT
let mongoURI = process.env.DEV_MONGO_URI

module.exports = { PORT, mongoURI }