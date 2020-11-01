const moviesRouter = require('express').Router()
const Movie = require('../models/movies')
const User = require('../models/users')
const parser = require('body-parser')
const jwt = require('jsonwebtoken')
const { PAGINATION_SIZE, SECRET, ROLES } = require('../utils/config')

moviesRouter.use(parser.urlencoded({extended: true}))

const parseAndRound = n => {
    return Math.abs(Number.parseInt(n))
}

const getTokenFromRequest = request => {
    const auth = request.get('authorization')
    if(auth && auth.toLowerCase().startsWith('bearer ')) {
        let [_, token] = auth.split(/\s/)
        return token
    }
    return null
}

// get available movies without a particular ordering. Limit of returned results was set at 'PAGINATION_SIZE'

moviesRouter.get('/', async (request, response, next) => {
    try {
        let {skip, limit, view} = request.query
        const token = getTokenFromRequest(request)
        const decodedToken = token ? jwt.verify(token, SECRET) : null
        const user = decodedToken !== null ? await User.findById(decodedToken.id) : null
        const isAdmin = user === null ? false : user.role === ROLES.ADMIN
        let queryObject = null
        
        if(isAdmin) {
            switch(view) {
                case 'available': {
                    queryObject = {availability: true}
                    break;
                }
                case 'unavailable': {
                    queryObject = {availability: false}
                    break;
                }
                default: {
                    queryObject = {}
                }
            }
        }
    
        skip = parseAndRound(skip || 0)
        limit = limit ? parseAndRound(limit) : PAGINATION_SIZE
        let availableMovies = 
            await Movie
                    .find(isAdmin ? queryObject : {availability: true})
                    .skip(isNaN(skip) ? 0 : skip)   /* When a user agent sends a string which can't be parsed into a number, use defaults */
                    .limit(isNaN(limit) || limit === 0 ? PAGINATION_SIZE : limit)
        response.json(availableMovies)
    } catch (error) {
        next(error)
    }
})

// get a sorted list of available movies. Sorting by 'title' is the default. Limit of returned results was set at 'PAGINATION_SIZE'
// $ curl 'localhost:8000/api/movies/sort/?by=title'
// $ curl 'localhost:8000/api/movies/sort/?by=popularity'

moviesRouter.get('/sort', async (request, response) => {
    let {by, skip, limit} = request.query;
    skip = parseAndRound(skip || 0)
    limit = limit ? parseAndRound(limit) : PAGINATION_SIZE
    if(by === 'popularity') {
        const results = 
            await Movie
                    .find({availability: true})
                    .skip(isNaN(skip) ? 0 : skip)
                    .limit(isNaN(limit) ? PAGINATION_SIZE : limit)
                    .sort({likes: 'desc'})
        response.json(results)
    } else {
        const results = 
            await Movie
                    .find({availability: true})
                    .skip(isNaN(skip) ? 0 : skip)
                    .limit(isNaN(limit) ? PAGINATION_SIZE : limit)
                    .sort({title: 'asc'})
        response.json(results)
    }
})

// get info about a particular movie that is available

moviesRouter.get('/search/:title', async (request, response) => {
    const {title} = request.params
    const [movie] = await Movie.find({title, availability: true})
    if(movie === undefined) {
        response.status(404).json({message: `No movie with title "${title}" found`})
    } else {
        response.json(movie)
    }
})

moviesRouter.post('/like', async (request, response, next) => {
    try {
        const {title} = request.body
        if(title === undefined) {
            return response.status(404).json({error: 'No movie title specified'})
        }
        const movie = await Movie.findOne({title})
        if(!movie) {
            // If no movie has been found with ${title}
            return response.status(404).json({error: `No movie with title: ${title}`})
        }
        const token = getTokenFromRequest(request)
        const decodedToken = jwt.verify(token, SECRET)
        if(!(token && decodedToken.id)) {
            return response.status(401).json({error: 'token missing or invalid'})
        }
        const user = await User.findById(decodedToken.id)
        // if ${user} has already 'liked' this movie
        if(user.likedMovies.indexOf(movie.id) !== -1) {
            return response.status(204).end()
        }
        await User.findByIdAndUpdate(user.id, {likedMovies: [...user.likedMovies, movie.id]})
        await Movie.findByIdAndUpdate(movie.id, {likes: movie.likes + 1}, {'new': true})
        response.status(200).json({message: 'liked!', likes: movie.likes + 1})
    } catch (error) {
        next(error)
    }
})

module.exports = moviesRouter