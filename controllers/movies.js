const moviesRouter = require('express').Router()
const movies = require('../models/movies')
const Movie = require('../models/movies')

// get all available movies

moviesRouter.get('/', async (request, response) => {
    let availableMovies = await Movie.find({availability: true})
    response.json(availableMovies)
})

// get info about a particular movie that is available

moviesRouter.get('/:title', async (request, response) => {
    const {title} = request.params
    const [movie] = await Movie.find({title, availability: true})
    if(movie === undefined) {
        response.status(404).json({message: `No movie with title "${title}" found`})
    } else {
        response.json(movie)
    }
})

module.exports = moviesRouter