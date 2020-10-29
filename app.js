const config = require('./utils/config')
const mongoose = require('mongoose')
const moviesRouter = require('./controllers/movies')
const express = require('express')
const application = express()

mongoose.connect(config.mongoURI, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
    .then(() => {
        console.log(`Connected to MongoDB: ${config.mongoURI}`)
    })
    .catch(error => {
        console.log(`Error connecting to MongoDB: ${error.message}`)
    })


application.use('/api/movies', moviesRouter)

module.exports = application