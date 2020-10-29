const moviesRouter = require('express').Router()
const Movie = require('../models/movies')
const parser = require('body-parser')

moviesRouter.use(parser.urlencoded())

let defaultLimit = 5

const parseAndRound = n => {
    return Math.abs(Number.parseInt(n))
}

// get available movies without a particular ordering. Limit of returned results was set at 'defaultLimit'

moviesRouter.get('/', async (request, response) => {
    let {skip, limit} = request.query
    skip = parseAndRound(skip || 0)
    limit = limit ? parseAndRound(limit) : defaultLimit
    let availableMovies = 
        await Movie
                .find({availability: true})
                .skip(isNaN(skip) ? 0 : skip)   /* When a user agent sends a string which can't be parsed into a number, use defaults */
                .limit(isNaN(limit) ? defaultLimit : limit)
    response.json(availableMovies)
})

// get a sorted list of available movies. Sorting by 'title' is the default. Limit of returned results was set at 'defaultLimit'
// $ curl 'localhost:8000/api/movies/sort/?by=title'
// $ curl 'localhost:8000/api/movies/sort/?by=popularity'

moviesRouter.get('/sort', async (request, response) => {
    let {by, skip, limit} = request.query;
    skip = parseAndRound(skip || 0)
    limit = limit ? parseAndRound(limit) : defaultLimit
    if(by === 'popularity') {
        const results = 
            await Movie
                    .find({availability: true})
                    .skip(isNaN(skip) ? 0 : skip)
                    .limit(isNaN(limit) ? defaultLimit : limit)
                    .sort({likes: 'desc'})
        response.json(results)
    } else {
        const results = 
            await Movie
                    .find({availability: true})
                    .skip(isNaN(skip) ? 0 : skip)
                    .limit(isNaN(limit) ? defaultLimit : limit)
                    .sort({title: 'asc'})
        response.json(results)
    }
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