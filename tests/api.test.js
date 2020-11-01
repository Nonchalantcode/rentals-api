const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const User = require('../models/users')
const Movie = require('../models/movies')
const { initialUsers, initialMovies, moviesInDB, usersInDB, mockMovie, testMovie } = require('./helpers')
const { describe, test, expect, beforeEach } = require('@jest/globals')

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
        let randomMovie = initialMovies[Math.floor(Math.random() * initialMovies.length)]
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

    test('A registered and logged in user can "like" a movie', async () => {
        let authToken = await getAuthToken(initialUsers[1])
        const allMovies = await moviesInDB()
        const randomMovie = allMovies[Math.floor(Math.random() * allMovies.length)]
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
        const randomMovie = allMovies[Math.floor(Math.random() * allMovies.length)]
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

})

afterAll((done) => {
    mongoose.connection.close()
    done()
})