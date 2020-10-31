const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/users')
const { SECRET } = require('../utils/config')

loginRouter.post('/', async (request, response) => {
    const {userName, password} = request.body
    const user = await User.findOne({userName})
    console.log(`Username: ${userName}. Password: ${password}`)
    console.log(`Passwordhash ${user.passwordHash}`)
    console.log(user.toString())
    const correctPassword = user === null 
        ? false 
        : await bcrypt.compare(password, user.passwordHash)

    if(!(user && correctPassword)) {
        return response.status(401).json({error: 'username or password is incorrect'})
    }

    const useInToken = {
        userName,
        id: user._id.toString()
    }

    const token = jwt.sign(useInToken, SECRET)
    response
        .status(200)
        .send({token, userName})
})

module.exports = loginRouter