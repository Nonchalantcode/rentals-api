const config = require('./utils/config')
const mongoose = require('mongoose')
const express = require('express')
const application = express()
const usersRouter = require('./controllers/users')
const moviesRouter = require('./controllers/movies')
const loginRouter = require('./controllers/login')
const { unknownEndpoint } = require('./utils/middleware')
const { info } = require('./utils/logger')

mongoose.connect(config.mongoURI, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
    .then(() => {
        info(`Connected to MongoDB: ${config.mongoURI}`)
    })
    .catch(error => {
        error(`Error connecting to MongoDB: ${error.message}`)
    })

application.use(express.json())

application.use('/api/movies', moviesRouter)
application.use('/api/users', usersRouter)
application.use('/api/login', loginRouter)

application.use(unknownEndpoint)

module.exports = application