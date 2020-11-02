require('dotenv').config()

const PORT = process.env.PORT
let mongoURI = process.env.DEV_MONGO_URI
const SECRET = process.env.SECRET
const PAGINATION_SIZE = 5
const SALT_ROUNDS = 12
const DEFAULT_RENTAL_DAYS = 3
const TRANSACTION_MESSAGE = "transaction completed!"
const LOGOUT_MESSAGE = 'User needs to log in for this operation'
const LATE_TAX = 5 /* $5 per day */
const ROLES = {
    ADMIN: 'administrator',
    USER: 'user'
}

if(process.env.NODE_ENV === 'test') {
    mongoURI = 'mongodb://localhost:27017/rental-app-test'
}

module.exports = { mongoURI, DEFAULT_RENTAL_DAYS, LATE_TAX, PAGINATION_SIZE, PORT, ROLES, SALT_ROUNDS, SECRET, LOGOUT_MESSAGE, TRANSACTION_MESSAGE  }