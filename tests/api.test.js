const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const User = require('../models/users')
const Movie = require('../models/movies')
const { initialUsers, initialMovies, moviesInDB, usersInDB, mockMovie, testMovie } = require('./helpers')
const { describe, test, expect, beforeEach } = require('@jest/globals')
const { TRANSACTION_MESSAGE, LOGOUT_MESSAGE } = require('../utils/config')
const BannedToken = require('../models/blacklist')

const getAuthToken = async (userCredentials) => {
    let token = null
        await api
            .post('/api/login')
            .send({userName: userCredentials.userName, password: userCredentials.password})
            .expect(response => {
                token = response.body
            })
    return token
}

const tempUser = {email: 'testemail1@testemail1.com', password: 'mypass123', userName: 'testuser1'}

const createTempUser = async () => {
    let newUser = null
    await api
        .post('/api/users')
        .send(tempUser)
        .expect(200)
        .expect(response => {
            newUser = response.body
        })
    return newUser
}

const deleteTempUser = async () => {
    return await User.findOneAndDelete({email: tempUser.email})
}

const loginTempUser = async () => {
    let jwt = null
    await api
            .post('/api/login')
            .send({userName: tempUser.userName, password: tempUser.password})
            .expect(response => {
                jwt = response.body
            })
    return jwt
}

const logoutUser = async (token) => {
    return await api
            .post('/api/logout')
            .send({userName: token.userName, token: token.token})
            .expect(204)
}

const clearBlacklist = async () => {
    await BannedToken.deleteMany({})
}

const pickRandom = coll => {
    return coll[Math.floor(Math.random() * coll.length)]
}

describe(`When there are initially some movies (${initialMovies.length}) in the DB`, () => {
    beforeEach(async () => {
        await Movie.deleteMany({})
        for(let movie of initialMovies) {
            await new Movie(movie).save()
        }
    })

    test('Any user can get the list of available movies', async () => {
        let unavailableTestMovie = await mockMovie()
        await api
            .get(`/api/movies/?limit=${initialMovies.length}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .expect(response => {
                if(response.body.length !== initialMovies.length) {
                    throw new Error('Not all movies are returned')
                }
            })
        
        Movie.findByIdAndDelete(unavailableTestMovie.id)
    })

    test('Movies are returned sorted by title by default', async () => {
        let sortedMovieTitles = 
                initialMovies
                    .map(movieObj => movieObj.title)
                    .sort()

        await api
            .get(`/api/movies/sort/?limit=${initialMovies.length}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .expect(response => {
                if(response.body.length !== initialMovies.length) {
                    throw new Error('Not all movies are returned')
                }
                let sorted = response.body.every((movieObj, index) => {
                    return movieObj.title === sortedMovieTitles[index]
                })
                if(!sorted) {
                    throw new Error('Movies are not being sorted by title')
                }
            })
    })

    test('Movies can be sorted by popularity/likes', async () => {
        let sortedMoviesByLikes =
                initialMovies
                    .map(movieObj => movieObj.likes)
                    .sort((a,b) => a > b ? -1 : 1)
        
        await api
            .get(`/api/movies/sort/?by=popularity&limit=${initialMovies.length}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .expect(response => {
                if(response.body.length !== initialMovies.length) {
                    throw new Error('Not all movies are returned')
                }
                let sorted = response.body.every((movieObj, index) => {
                    return movieObj.likes === sortedMoviesByLikes[index]
                })
                if(!sorted) {
                    throw new Error('Movies are not being sorted by popularity')
                }
            })
    })

    test('Users can skip certain number of results they get (pagination)', async () => {
        let TO_SKIP = 3
        await api
            .get(`/api/movies/?skip=${TO_SKIP}&limit=${initialMovies.length}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .expect(response => {
                if(response.body.length !== (initialMovies.length - TO_SKIP)) {
                    throw new Error('Results are not being paginated correctly')
                }
            })
    })

    test('Users can limit the number of results they get (pagination)', async () => {
        let LIMIT = 3
        await api
            .get(`/api/movies/?limit=${LIMIT}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .expect(response => {
                if(response.body.length !== LIMIT) {
                    throw new Error('Results are not being paginated correctly')
                }
            })
    })

    test('A movie can be retrieved by title', async () => {
        let randomMovie = pickRandom(initialMovies)
        await api
            .get(`/api/movies/search/${randomMovie.title}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })

    test('A movie without a matching title returns a 404 status code', async () => {
        let NOT_FOUND = 'Not found movie title'
        await api
            .get(`/api/movies/search/${NOT_FOUND}`)
            .expect(404)
    })

})

describe('When there are initially 2 users in the DB', () => {
    beforeEach(async () => {
        await User.deleteMany({})
        for(let user of initialUsers) {
            await api
                    .post('/api/users')
                    .send(user)
        }
    })

    test('Creating a user with fresh credentials succeeds', async () => {

        let user = {
            email: 'newuser@gmail.com',
            userName: 'newuser',
            password: 'userpassword123'
        }
        await api
            .post('/api/users')
            .send(user)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        let allUsers = await usersInDB()
        expect(allUsers).toHaveLength(initialUsers.length + 1)
    })

    test('Creating a user with an already-taken email fails', async () => {
        await api
            .post('/api/users')
            .send(initialUsers[0])
            .expect(401)
            .expect('Content-Type', /application\/json/)
    })

    test('A login attempt by a registered user succeeds', async () => {
        let {userName, password} = initialUsers[1]
        await api
            .post('/api/login')
            .send({userName, password})
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })
    
    test('A login attempt by a non-registered user or a user using bad credentials fails', async () => {
        let invalidUser = {userName: 'invalidUser1', password: 'password123'}
        await api
            .post('/api/login')
            .send({...invalidUser})
            .expect(401)
    })

    test('An operation that requires authentication (liking a movie) by a user with an expired JWT fails', async () => {
        let temporaryUser = await createTempUser()
        let jwt = await loginTempUser()
        await logoutUser(jwt)
        await api
            .post('/api/movies/like')
            .set('Authorization', `bearer ${jwt.token}`)
            .send({title: initialMovies[0].title})
            .expect(401)
            .expect(response => {
                if(response.body.error !== LOGOUT_MESSAGE) {
                    throw Error("User not being asked correctly to authenticate")
                }
            })
            
        // check that the token was saved to the blacklist
        expect(await BannedToken.findOne({token: jwt.token, userName: jwt.userName})).not.toEqual(null)
            
        await deleteTempUser()
        // check that the temporary user was deleted
        expect(await User.findById(temporaryUser.id)).toEqual(null)
    })

    test('A registered and logged in user can "like" a movie', async () => {
        let authToken = await getAuthToken(initialUsers[1])
        const allMovies = await moviesInDB()
        const randomMovie = pickRandom(allMovies)
        await api
            .post('/api/movies/like')
            .set('Authorization', `bearer ${authToken.token}`)
            .send({title: randomMovie.title})
            .expect(200)
            .expect(response => {
                if(response.body.likes !== randomMovie.likes + 1) {
                    throw new Error("Like functionality badly implemented")
                }
            })
    })

    test('Only a logged in user can "like" a movie', async () => {
        const allMovies = await moviesInDB()
        const randomMovie = pickRandom(allMovies)
        await api
            .post('/api/movies/like')
            .send({title: randomMovie.title})
            .expect(401)
    })

    test('A user with admin privileges can see a list of available and unavailable movies', async () => {
        const unavailableTestMovie = await mockMovie()
        let adminToken = await getAuthToken(initialUsers[0])
        await api
            .get(`/api/movies/?limit=${initialMovies.length + 1}`)
            .set('Authorization', `bearer ${adminToken.token}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .expect(response => {
                if(response.body.length !== initialMovies.length + 1) {
                    throw new Error("Admin user is not pulling all movies")
                }
            })
        
        await Movie.findByIdAndDelete(unavailableTestMovie.id)
    })

    test('A user with admin privileges that is logged out is asked to log in again', async () => {
        let adminToken = await getAuthToken(initialUsers[0])
        await logoutUser(adminToken)
        await api
            .get(`/api/movies/?limit=${initialMovies.length + 1}`)
            .set('Authorization', `bearer ${adminToken.token}`)
            .expect(401)
            .expect(response => {
                let {body: {error}} = response
                if(error !== LOGOUT_MESSAGE) {
                    throw Error("User not being asked correctly to authenticate")
                }
            })
    })

    test('A user with admin privileges can get a list of unavailable movies', async () => {
        const unavailableTestMovie = await mockMovie()
        let adminToken = await getAuthToken(initialUsers[0])
        await api
            .get('/api/movies/?view=unavailable')
            .set('Authorization', `bearer ${adminToken.token}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .expect(response => {
                if(response.body.length !== 1) {
                    throw new Error("Admin user is not pulling unavailable movies")
                }
            })
        await Movie.findByIdAndDelete(unavailableTestMovie.id)
    })

    test("Logged-out admins can't get the list of unavailable movies without being asked to authenticate", async () => {
        const unavailableTestMovie = await mockMovie()
        let adminToken = await getAuthToken(initialUsers[0])
        await logoutUser(adminToken)
        await api
            .get('/api/movies/?view=unavailable')
            .set('Authorization', `bearer ${adminToken.token}`)
            .expect(401)
            .expect(response => {
                let {body: {error}} = response
                if(error !== LOGOUT_MESSAGE) {
                    throw Error("User not being asked correctly to authenticate")
                }
            })
        await Movie.findByIdAndDelete(unavailableTestMovie.id)
    })

    test('A user with admin privileges can create a movie', async () => {
        let adminToken = await getAuthToken(initialUsers[0])
        await api
            .post('/api/movies')
            .set('Authorization', `bearer ${adminToken.token}`)
            .send({...testMovie})
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const allMovies = await moviesInDB()
        expect(allMovies).toHaveLength(initialMovies.length + 1)
        await Movie.findOneAndDelete({title: testMovie.title})

    })

    test("Logged-out admins can't create new movies", async () => {
        let adminToken = await getAuthToken(initialUsers[0])
        await logoutUser(adminToken)
        await api
            .post('/api/movies')
            .set('Authorization', `bearer ${adminToken.token}`)
            .send({...testMovie})
            .expect(401)
            .expect(response => {
                let {body: {error}} = response
                if(error !== LOGOUT_MESSAGE) {
                    throw Error("User not being asked correctly to authenticate")
                }
            })            

        const allMovies = await moviesInDB()
        expect(allMovies).toHaveLength(initialMovies.length)
    })

    test('A non-registered user cannot create a movie', async () => {
        await api
            .post('/api/movies')
            .send({...testMovie})
            .expect(403)
    })

    test('A registered user with non-admin privileges cannot create a movie', async () => {
        let userToken = await getAuthToken(initialUsers[1])
        await api
            .post('/api/movies')
            .set('Authorization', `bearer ${userToken.token}`)
            .send({...testMovie})
            .expect(403)

        const allMovies = await moviesInDB()
        expect(allMovies).toHaveLength(initialMovies.length)
    })

    test('Only a user with admin privileges can update a movie', async () => {
        let adminToken = await getAuthToken(initialUsers[0])
        let allMovies = await moviesInDB()
        let randomMovie = pickRandom(allMovies)
        let newTitle = "This is the updated title"
        // Let's update the title of ${randomMovie}
        await api
            .put(`/api/movies/${randomMovie.id}`)
            .set('Authorization', `bearer ${adminToken.token}`)
            .send({title: newTitle})
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .expect(response => {
                let updatedMovie = response.body
                if(updatedMovie.title !== newTitle) {
                    throw new Error("Movie wasn't updated")
                }
            })
    })

    test("A user with non-admin privileges can't update a movie", async () => {
        let userToken = await getAuthToken(initialUsers[1])
        let allMovies = await moviesInDB()
        let randomMovie = pickRandom(allMovies)
        let newTitle = "This is the updated title"
        // Let's update the title of ${randomMovie}
        await api
            .put(`/api/movies/${randomMovie.id}`)
            .set('Authorization', `bearer ${userToken.token}`)
            .send({title: newTitle})
            .expect(403)
    })

    test("A user with admin privileges can delete a movie from the DB", async () => {
        let adminToken = await getAuthToken(initialUsers[0])
        let movie = await mockMovie()
        let allMovies = await moviesInDB()

        // Check that the test movie entity was saved
        expect(allMovies).toHaveLength(initialMovies.length + 1)

        // Issue a DELETE request to delete the test movie
        await api
            .delete(`/api/movies/${movie.id}`)
            .set('Authorization', `bearer ${adminToken.token}`)
            .expect(200)
            
        // Check that the movie has been removed from the database
        expect(await Movie.findById(movie.id)).toBe(null)

    })

    test("A user with non-admin privileges can't delete a movie from the DB", async () => {
        let userToken = await getAuthToken(initialUsers[1])
        let movie = await mockMovie()
        let allMovies = await moviesInDB()

        // Check that the test movie entity was saved
        expect(allMovies).toHaveLength(initialMovies.length + 1)

        // Issue a DELETE request to delete the test movie
        await api
            .delete(`/api/movies/${movie.id}`)
            .set('Authorization', `bearer ${userToken.token}`)
            .expect(403)
        
        // Check that the movie still exists in the database
        expect(await Movie.findById(movie.id)).not.toBe(null)

        // finally, delete the test movie
        await Movie.findByIdAndDelete(movie.id)
    })

    test("A logged in user can buy a movie", async () => {
        let userToken = await getAuthToken(initialUsers[1])
        let allMovies = await moviesInDB()
        let randomMovie = pickRandom(allMovies)
        let copies = 1
        await api
            .post(`/api/movies/store/buy/${randomMovie.title}`)
            .set('Authorization', `bearer ${userToken.token}`)
            .send({copies})
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .expect(response => {
                let data = response.body
                if(data.message !== TRANSACTION_MESSAGE) {
                    throw new Error("Purchase functionality not working as expected.")
                }
            })

        let movie = await Movie.findById(randomMovie.id)
        let user = await User.findOne({email: initialUsers[1].email})
        expect(movie.stock).toBe(randomMovie.stock - copies)
        // Check that the movie was registered as part of the purchases field of this user.
        expect(user.purchases[0].movie.toString()).toBe(movie._id.toString())

        await user.updateOne({purchases: []})
    })

    test("A user that isn't logged-in can't buy a movie", async () => {
        let allMovies = await moviesInDB()
        let randomMovie = pickRandom(allMovies)
        let copies = 1
        await api
            .post(`/api/movies/store/buy/${randomMovie.title}`)
            .send({copies})
            .expect(401)

        let movie = await Movie.findById(randomMovie.id)
        // The amount of copies available for a movie didn't decrease by ${copies}
        expect(movie.stock).toBe(randomMovie.stock)
    })

    test("A logged in user can rent a movie", async () => {
        let userToken = await getAuthToken(initialUsers[1])
        let allMovies = await moviesInDB()
        let randomMovie = pickRandom(allMovies)
        let copies = 1
        let user = await User.findOne({email: initialUsers[1].email})

        // Check that the 'rentals' field of this user is empty
        expect(user.rentals).toHaveLength(0)

        await api
            .post(`/api/movies/store/rent/${randomMovie.title}`)
            .set('Authorization', `bearer ${userToken.token}`)
            .send({copies})
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .expect(response => {
                let data = response.body
                if(data.message !== TRANSACTION_MESSAGE) {
                    throw new Error("Rental functionality not working as expected.")
                }
            })

        let movie = await Movie.findById(randomMovie.id)
        expect(movie.stock).toBe(randomMovie.stock - copies)

        // Retrieve the updated user from the database and confirm that the 
        // movie sent above is part of its rentals field now
        user = await User.findById(user.id)
        expect(user.rentals[0].movie.toString()).toBe(movie._id.toString())

        await user.updateOne({rentals: []})
    })

    test("A logged-in user can return a movie", async () => {
        let userToken = await getAuthToken(initialUsers[1])
        let allMovies = await moviesInDB()
        let randomMovie = pickRandom(allMovies)
        let copies = 1
        let user = await User.findOne({email: initialUsers[1].email})
        
        expect(user.rentals).toHaveLength(0)

        await api
            .post(`/api/movies/store/rent/${randomMovie.title}`)
            .set('Authorization', `bearer ${userToken.token}`)
            .send({copies})
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .expect(response => {
                let data = response.body
                if(data.message !== TRANSACTION_MESSAGE) {
                    throw new Error("Rental functionality not working as expected.")
                }
            })

        // query the DB again to get the user with the updated 'rentals' field
        user = await User.findById(user.id)
        expect(user.rentals).toHaveLength(1)

        await api
            .post(`/api/movies/ret/${randomMovie.title}`)
            .set('Authorization', `bearer ${userToken.token}`)
            .send(null)
            .expect(200)
        
        // query the DB again to get the user with the updated 'rentals' field
        user = await User.findById(user.id)
        expect(user.rentals).toHaveLength(0)

    })

    test("A logged-in user is taxed a late fee if he returns a movie late", async () => {
        let userToken = await getAuthToken(initialUsers[1])
        let allMovies = await moviesInDB()
        let randomMovie = pickRandom(allMovies)
        let copies = 1
        let user = await User.findOne({email: initialUsers[1].email})
        
        expect(user.rentals).toHaveLength(0)

        await api
            .post(`/api/movies/store/rent/${randomMovie.title}`)
            .set('Authorization', `bearer ${userToken.token}`)
            .send({copies})
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .expect(response => {
                let data = response.body
                if(data.message !== TRANSACTION_MESSAGE) {
                    throw new Error("Rental functionality not working as expected.")
                }
            })

        // query the DB again to get the user with the updated 'rentals' field
        user = await User.findById(user.id)
        expect(user.rentals).toHaveLength(1)

        // mock a late-return date by modifying the rented movie object to have a return date
        // 3 days earlier than the delivery date
        // Since all movies that are rented have a return date set for 3 days from the day
        // the movie was rented, we need to go back 5 days to mock the 3-day late-return-date
        
        let movie = user.rentals[0]
        movie.returnDate = movie.returnDate - (5 * 60 * 60 * 24 * 1000)
        await user.updateOne({rentals: [movie]})

        // "return" the movie to the store
        await api
            .post(`/api/movies/ret/${randomMovie.title}`)
            .set('Authorization', `bearer ${userToken.token}`)
            .send(null)
            .expect(200)
        
        // query the DB again to get the user with the updated 'rentals' field
        user = await User.findById(user.id)
        expect(user.rentals).toHaveLength(0)
        expect(user.overdueTax).toEqual(15)
    })

})

afterAll(async (done) => {
    await clearBlacklist()
    mongoose.connection.close()
    done()
})