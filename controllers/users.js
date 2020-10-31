const bcrypt = require('bcrypt')
const User = require('../models/users')
const usersRouter = require('express').Router()
const { SALT_ROUNDS, ROLES } = require('../utils/config')

const emailInDB = async (email) => {
    return await User.findOne({email}).exec()
}

// create a new user

usersRouter.post('/', async (request, response) => {
    let {email, password, userName, role} = request.body
    role = role !== ROLES.ADMIN ? 'user' : role /* enforce 'user' role by default' */
    
    if(await emailInDB(email)) {
        return response.status(400).json({message: `User with email ${email} already exists`})
    }
    
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = new User({
        email,
        userName,
        passwordHash,
        role
    })
    const savedUser = await user.save()
    response.json(savedUser)
})

module.exports = usersRouter