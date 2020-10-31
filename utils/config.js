require('dotenv').config()

const PORT = process.env.PORT
let mongoURI = process.env.DEV_MONGO_URI
const SECRET = process.env.SECRET
const PAGINATION_SIZE = 5
const SALT_ROUNDS = 12
const ROLES = {
    ADMIN: 'administrator',
    USER: 'user'
}

if(process.env.NODE_ENV === 'test') {
    mongoURI = 'mongodb://localhost:27017/rental-app-test'
}

module.exports = { mongoURI, PAGINATION_SIZE, PORT, ROLES, SALT_ROUNDS, SECRET  }