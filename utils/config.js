require('dotenv').config()

const PORT = process.env.PORT
let mongoURI = process.env.DEV_MONGO_URI
const PAGINATION_SIZE = 5
const SALT_ROUNDS = 12

module.exports = { mongoURI, PAGINATION_SIZE, PORT, SALT_ROUNDS  }