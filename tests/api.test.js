const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const User = require('../models/users')
const Movie = require('../models/movies')
const { initialUsers, initialMovies, moviesInDB, usersInDB } = require('./helpers')
const { describe, test, expect, beforeEach } = require('@jest/globals')


describe(`When there are initially some movies (${initialMovies.length}) in the DB`, () => {
    beforeEach(async () => {
        await Movie.deleteMany({})
        for(let movie of initialMovies) {
            await new Movie(movie).save()
        }
    })

    test('Any user can get the list of available movies', async () => {
        await api
            .get(`/api/movies/?limit=${initialMovies.length}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .expect(response => {
                if(response.body.length !== initialMovies.length) {
                    throw new Error('Not all movies are returned')
                }
            })

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
            .expect(400)
            .expect('Content-Type', /application\/json/)
    })

})

afterAll((done) => {
    mongoose.connection.close()
    done()
})