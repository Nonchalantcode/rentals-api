const logoutRouter = require('express').Router()
const BannedToken = require('../models/blacklist')

logoutRouter.post('/', async (request, response, next) => {
    try {
        const {userName, token} = request.body

        if(userName === undefined || token === undefined) return response.status(400).json({error: 'no token or username specified'})

        const bannedToken = new BannedToken({
            token,
            userName
        })

        await bannedToken.save()
        response.status(204).end()

    } catch (error) {
        next(error)
    }
})

module.exports = logoutRouter