const moviesRouter = require('express').Router()
const movies = require('../models/movies')
const Movie = require('../models/movies')

// get all available movies

moviesRouter.get('/', async (request, response) => {
    let availableMovies = await Movie.find({availability: true})
    response.json(availableMovies)
})

module.exports = moviesRouter