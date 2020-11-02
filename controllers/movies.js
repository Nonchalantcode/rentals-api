const moviesRouter = require('express').Router()
const Movie = require('../models/movies')
const User = require('../models/users')
const parser = require('body-parser')
const jwt = require('jsonwebtoken')
const { PAGINATION_SIZE, SECRET, ROLES, DEFAULT_RENTAL_DAYS, TRANSACTION_MESSAGE, LATE_TAX, LOGOUT_MESSAGE } = require('../utils/config')
const { logTransaction } = require('../utils/logger')
const BannedToken = require('../models/blacklist')

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

const getMovieDetails = body => {
    let {title, description, posters, stock, rentalPrice, salePrice, availability, likes} = body
    return new Movie({
        title, 
        description,
        posters,
        stock,
        rentalPrice,
        salePrice,
        availability: availability || true,
        likes: likes || 0
    })
}

const summarizeUpdates = obj => {
    return Object.keys(obj)
            .reduce((result, currentProp) => {
                result.push(
                  `"${currentProp}" is now "${obj[currentProp]}"`
                )
                return result
            }, [])
            .join('\n')
}

const getDaysDifference = (d1, d2) => {
	const date1 = new Date(d1)
	const date2 = new Date(d2)
	const diffTime = Math.abs(date2 - date1)
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
	return diffDays
}

const isLoggedOut = async (token, userName) => {
    return await BannedToken.findOne({token, userName}) !== null
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

        if(isAdmin && await isLoggedOut(token, user.userName)) {
            return response.status(401).json({error: LOGOUT_MESSAGE})
        } 

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

        if(await isLoggedOut(token, user.userName)) {
            return response.status(401).json({error: LOGOUT_MESSAGE})
        }

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

moviesRouter.post('/', async (request, response, next) => {
    try {
        const token = getTokenFromRequest(request)
        const decodedToken = token ? jwt.verify(token, SECRET) : null
        const user = decodedToken !== null ? await User.findById(decodedToken.id) : null
        const isAdmin = user === null ? false : user.role === ROLES.ADMIN

        if(isAdmin && await isLoggedOut(token, user.userName)) {
            return response.status(401).json({error: LOGOUT_MESSAGE})
        }

        if(isAdmin) {
            const movie = getMovieDetails(request.body)
            await movie.save()
            return response.status(201).send(movie)
        }
        response.status(403).json({error: 'Forbidden'})
    } catch (error) {
        next(error)
    }
})

// Update the information of a movie entity in the DB

moviesRouter.put('/:movieID', async (request, response, next) => {
    try {
        const token = getTokenFromRequest(request)
        const decodedToken = token ? jwt.verify(token, SECRET) : null
        const user = decodedToken !== null ? await User.findById(decodedToken.id) : null
        const isAdmin = user === null ? false : user.role === ROLES.ADMIN

        if(isAdmin && await isLoggedOut(token, user.userName)) {
            return response.status(403).json({error: LOGOUT_MESSAGE})
        }

        if(isAdmin) {
            const {movieID} = request.params
            const {title, description, posters, stock, rentalPrice, salePrice, availability, likes} = request.body
            const populatedProps = 
                [
                    {title},
                    {description},
                    {posters},
                    {stock},
                    {rentalPrice},
                    {salePrice},
                    {availability},
                    {likes}
                ].reduce((result, currentObject) => {
                    // access the only property of this object
                    let V = currentObject[Object.keys(currentObject)] 
                    if(V === undefined) return result
                    result = {...result, ...currentObject}
                    return result
                }, Object.create(null))

            let updatedMovie = await Movie.findByIdAndUpdate(movieID, populatedProps, {'new': true})
            logTransaction(
                `Updated ${updatedMovie.id} on ${new Date().toISOString()}. ${summarizeUpdates(populatedProps)}\n`, "update"
            )
            return response.json(updatedMovie)
        }
        response.status(403).json({error: 'Forbidden'})
    } catch (error) {
        next(error)
    }
})

moviesRouter.delete('/:movieID', async (request, response, next) => {
    try {
        const token = getTokenFromRequest(request)
        const decodedToken = token ? jwt.verify(token, SECRET) : null
        const user = decodedToken !== null ? await User.findById(decodedToken.id) : null
        const isAdmin = user === null ? false : user.role === ROLES.ADMIN

        if(isAdmin && await isLoggedOut(token, user.userName)) {
            return response.status(401).json({error: LOGOUT_MESSAGE})
        }

        if(isAdmin) {
            const {movieID} = request.params
            await Movie.findByIdAndDelete(movieID)
            return response.json({message: `Deleted. ID was ${movieID}`})
        }
        response.status(403).json({error: 'Forbidden'})
    } catch (error) {
        next(error)
    }
})

moviesRouter.post('/store/:transaction/:title', async (request, response, next) => {
    try {
        const {title, transaction} = request.params
        if(transaction !== "buy" && transaction !== "rent") {
            return response.status(404).send({error: "unknown endpoint"})
        }
        let {copies} = request.body
        copies = parseAndRound(copies || 1)

        const token = getTokenFromRequest(request)
        const decodedToken = jwt.verify(token, SECRET)

        if(!decodedToken.id) {
            return response.status(401).json({error: 'token missing or invalid'})
        }

        const user = await User.findById(decodedToken.id)

        if(await isLoggedOut(token, user.userName)) {
            return response.status(401).json({error: LOGOUT_MESSAGE})
        }

        const movie = await Movie.findOne({title})

        if(!movie) {
            return response.status(404).json({error: `No movie with title "${title}" found`})
        }

        if(movie.stock < copies) {
            return response.status(400).json({error: `Only ${movie.stock} copies of this movie currently available`})
        }

        const transactionDate = Date.now()
        const transactionDateObj = new Date(transactionDate)
        const returnDate = transactionDateObj.setDate(transactionDateObj.getDate() + DEFAULT_RENTAL_DAYS)
        const unitPrice = movie.salePrice
        const totalCharge = unitPrice * copies

        await movie.updateOne({stock: movie.stock - copies})

        if(transaction === "buy") {
            await user.updateOne({
                purchases: [...user.purchases, {movie: movie.id, copies, purchaseDate: transactionDate, unitPrice, totalCharge}]
            })
        } else if (transaction === "rent") {
            await user.updateOne({
                rentals: [...user.rentals, {movie: movie.id, copies, rentalDate: transactionDate, returnDate, unitPrice, totalCharge}]
            })
        }

        const transactionSummary = {
            title,
            unitPrice,
            totalCharge,
            copies,
            transactionDate: new Date(transactionDate)
        }

        if(transaction === "buy") {
            logTransaction(
                `User ${user.userName} with id ${user.id} purchased ${copies} copies of movie "${title}" with unit price ${unitPrice} for a total of ${totalCharge}. Transaction date: ${new Date(transactionDate).toString()}\n`, "purchase"
            )
        } else if (transaction === "rent") {
            logTransaction(
                `User ${user.userName} with id ${user.id} rented ${copies} copies of movie "${title}" with unit price ${unitPrice} for a total of ${totalCharge}. Transaction date: ${new Date(transactionDate)}. Return Date: ${new Date(returnDate)}\n`, "rental"
            )
        }

        response.status(200).json({
            message: TRANSACTION_MESSAGE,
            summary: transaction === "buy" ? transactionSummary : {...transactionSummary, returnDate: new Date(returnDate)}
        })

    } catch (error) {
        next(error)
    }
})

moviesRouter.post('/ret/:title', async (request, response, next) => {
    try {
        const {title} = request.params
        const token = getTokenFromRequest(request)
        const decodedToken = jwt.verify(token, SECRET)

        if(!decodedToken.id) {
            return response.status(401).json({error: 'token missing or invalid'})
        }

        const user = await User.findById(decodedToken.id)

        if(await isLoggedOut(token, user.userName)) {
            return response.status(401).json({error: LOGOUT_MESSAGE})
        }

        const movie = await Movie.findOne({title})
        let rentals = user.rentals

        if(rentals.length === 0) return response.status(400).json({error: "User isn't currently renting this movie"})

        const movieIndex = rentals.findIndex(m => m.movie.toString() === movie._id.toString())

        if(movieIndex === -1) return response.status(400).json({error: "User isn't currently renting this movie"})

        // If we reach this point we need to remove the movie we're returning to the store from
        // the 'rentals' array

        const movieRentalInfo = rentals[movieIndex]
        const isLate = Date.now() - movieRentalInfo.returnDate > 0
        rentals.splice(movieIndex, 1)
        await user.updateOne({rentals})

        /* 
            if the user returns a rented movie late, apply a late fee per each late day 
            multiplied by the number of copies of the same movie he rented (assuming he rented
            several copies instead of just one copy)
        */

        if(isLate) {
            let daysDiff = getDaysDifference(Date.now(), movieRentalInfo.returnDate)
            let overdueTax = (user.overdueTax || 0) + (daysDiff * LATE_TAX * movieRentalInfo.copies)
            await user.updateOne({overdueTax})
        }
        
        response.status(200).end()

    } catch (error) {
        next(error)
    }
})

module.exports = moviesRouter