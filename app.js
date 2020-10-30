const config = require('./utils/config')
const mongoose = require('mongoose')
const moviesRouter = require('./controllers/movies')
const express = require('express')
const usersRouter = require('./controllers/users')
const application = express()

mongoose.connect(config.mongoURI, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
    .then(() => {
        console.log(`Connected to MongoDB: ${config.mongoURI}`)
    })
    .catch(error => {
        console.log(`Error connecting to MongoDB: ${error.message}`)
    })

application.use(express.json())

application.use('/api/movies', moviesRouter)
application.use('/api/users', usersRouter)

module.exports = application