const bcrypt = require('bcrypt')
const User = require('../models/users')
const usersRouter = require('express').Router()
const { SALT_ROUNDS } = require('../utils/config')

const emailInDB = email => {
    return User.findOne({email}) ? true : false
}

// create a new user

usersRouter.post('/', async (request, response) => {
    const {email, password, userName, role} = request.body
    if(emailInDB(email)) {
        return response.status(400).json({message: `User with email ${email} already exists`})
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = new User({
        email,
        userName,
        passwordHash,
        role: role || 'user'
    })
    const savedUser = await user.save()
    response.json(savedUser)
})

module.exports = usersRouter