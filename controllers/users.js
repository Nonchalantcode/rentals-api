const bcrypt = require('bcrypt')
const User = require('../models/users')
const usersRouter = require('express').Router()
const { SALT_ROUNDS, ROLES } = require('../utils/config')

const emailInDB = async (email) => {
    return await User.findOne({email}).exec()
}

// create a new user

usersRouter.post('/', async (request, response, next) => {
    try {
        let {email, password, userName, role} = request.body
        role = role !== ROLES.ADMIN ? 'user' : role /* enforce 'user' role by default' */
        
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
        const user = new User({
            email,
            userName,
            passwordHash,
            role
        })
        const savedUser = await user.save()
        response.json(savedUser)
    } catch (error) {
        next(error)
    }
})

module.exports = usersRouter