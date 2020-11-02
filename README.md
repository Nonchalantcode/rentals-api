# RESTful API technical test

## Heroku URL

https://afternoon-ocean-34870.herokuapp.com/api/movies/

This is the documentation of the RESTful movie rentals api.

## Installation

You'll need to clone this repo to your local machine:

`$ git clone https://github.com/Nonchalantcode/rentals-api.git`

Then, from your terminal:

`$ npm install`

You'll also need to have MongoDB installed on your machine to runs the tests defined in the repo as well as run the project locally.

You can download a copy of MongoDB for your OS from

https://www.mongodb.com/

** Note **

After installing a copy of MongoDB, you need to start the mongoDB service. If you're using a Linux based OS, you can do this with

`$ sudo systemctl start mongod`

** Note **

You'll need to create an **.env** file in root folder of this project on your local machine. You will need to define the following environment variables in **.env** file:

PORT=8000   // any free port will do, for example 3500
SECRET=secretpassphrase	     // any phrase will do. If the phrase has \s characters, you'll probably need to quote it
DEV_MONGO_URI='mongodb://localhost:27017/rental-app'

## Overview

The API is backed by a MongoDB database, and manipulated with mongoose.js. Each collection ("table") is backed by three models. A User model. A Movie model. And a Blacklist Model.

Each of those models define the shape or schema the documents will take in each of their respective collections. The User model is used to store info for each user, including a hash of the password he used when first registering to the api. This User collection stores info like "likes" (which movies the user has liked), purchases, rentals, and keeps track of late fees to apply.

For the "logout" functionality, I opted to make a Blacklist collection that will stored expired/invalid JWTs. This was for convenience purposes, but I know that faster in-memory DBs are the way to go when it comes to fast lookups for token blacklisting.

## Testing

You can run the tests defined in the **/tests** folder with `$ npm test`. This will make the project use a DB instance that is initialized according to the test requirements.

Jest is the testing framework used. supertest was used to facilitate testing the API endspoints. 

## API Endpoints. Examples

The entry points of the API are **/api/movies**, **/api/login**, **/api/logout**, and **/api/users**

**Note**: When a request doesn't match an endpoint, or an endpoint doesn't have a matching HTTP method, you'll get the fallback response with is "404 unknown endpoint"

**Note**: The Movies collection contains a small number of movies (#10), so, to simulate pagination, the default number of results returned was set to ${PAGINATION_SIZE} in the config.js file. It's currently set at 5 results. 

The examples below are shown using cURL syntax

### Registering as a new user (assuming the app is running on port 8000)

`$ curl --header 'Content-Type: application/json' --data '{"userName": "testuser", "password": "testpassword", "email": "someemail@gmail.com"}' localhost:8000/api/users`

### Creating an 'admin' user

`$ curl --header 'Content-Type: application/json' --data '{"userName": "testuser", "password": "testpassword", "email": "someemail@gmail.com", "role": "administrator"}' localhost:8000/api/users`

**Note**: a different endpoint or mechanism could have been used for this, such as matching against a private in-house db to register admins, etc. For illustration this should suffice.

### Logging in

`$ curl --header 'Content-Type: application/json' --data '{"userName": "testuser1", "password": "helloworld"}' localhost:8000/api/login`

This will return a JWT that you can use as payload for every request that needs an authorized user.

### Logging out

`$ curl --header 'Content-Type: application/json' --data '{"userName": "someuser", "token": "JWT_GOES_HERE"}' localhost:8000/api/logout`

### Getting a list of movies in no particular order (limited by ${PAGINATION_SIZE}

`$ curl localhost:8000/api/movies`

### Getting info for a particular movie

`$ curl 'localhost:8000/api/movies/name-of-the-movie'

### Getting a sorted list of available movies

*Note*: query parameters are `by=title`, `by=popularity`, `skip=[number]`, `limit=[number]`

`$ curl 'localhost:8000/api/movies/sort/?by=title'`
`$ curl 'localhost:8000/api/movies/sort/?by=popularity'`

// Among the 8 most popular movies, return the last 5.

`$ curl 'localhost:8000/api/movies/sort/?by=popularity&skip=3&limit=5'`

// Get the first 8 movies in alphabetical order, and return the last 5

`$ curl 'localhost:8000/api/movies/sort/?by=title&skip=3&limit=5'`

### "Liking" a movie (needs an authenticated user)

`$ curl --header 'Authorization: bearer JWT_TOKEN_GOES_HERE' --header 'Content-Type: application/json' --data '{"title": "MOVIE_TITLE_GOES_HERE"}' localhost:8000/api/movies/like`

You can find more examples of how routes work by looking at the source code of *controllers/movies.js*.

## Endpoints summary

| Endpoint                              | Method | Body / payload     | Needs authenticated user | Example                                       | Comment                                                                                                                                                                                                                              |
|---------------------------------------|--------|--------------------|--------------------------|-----------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| /api/movies                           | GET    |                    |                          | localhost:8000/api/movies                     |                                                                                                                                                                                                                                      |
| /api/movies                           | GET    |                    |                          | localhost:8000/api/movies/?skip=5             |                                                                                                                                                                                                                                      |
| /api/movies                           | GET    |                    |                          | localhost:8000/api/movies/?skip=5&limit=5     |                                                                                                                                                                                                                                      |
| /api/movies                           | GET    | JWT                | YES, an admin            | localhost:8000/api/movies/?view='unavailable' |                                                                                                                                                                                                                                      |
| /api/movies                           | GET    |                    |                          | localhost:8000/api/movies/sort/               | Takes a 'skip', 'limit', and 'by' query params. 'by' can be 'title' or 'popularity'. Defaults to 'title'                                                                                                                             |
| /api/movies                           | GET    | title              |                          | localhost:8000/api/movies/search/MOVIE_TITLE  |                                                                                                                                                                                                                                      |
| /api/movies/like                      | POST   | JWT, title         | YES                      | localhost:8000/api/movies/like                |                                                                                                                                                                                                                                      |
| /api/movies                           | POST   | JWT, (see comment) | Yes, an admin            | localhost:8000/api/movies/                    | Requires as payload all the required fields defined by the Movie model                                                                                                                                                               |
| /api/movies                           | PUT    | JWT, (see comment) | Yes, an admin            | localhost:8000/api/movies/MOVIE_ID            | Body of request must be all the  fields that will be updated for  a movie                                                                                                                                                            |
| /api/movies                           | DELETE | JWT                | Yes, an admin            | localhost:8000/api/movies/MOVIE_ID            |                                                                                                                                                                                                                                      |
| /api/movies/store/:transaction/:title | POST   | JWT                | YES                      | localhost:8000/api/movies/buy/MOVIE_ID        | Endpoint to "rent" or "buy" a movie. :transaction is either "rent" or  "buy"                                                                                                                                                         |
| /api/movies/ret/:title                | POST   | JWT                | YES                      | localhost:8000/api/movies/ret/MOVIE_TITLE     | Returns a movie. If the return is  past its return date, a fee will be applied to the offending user.                                                                                                                                |
| /api/users                            | POST   | (see comment)      |                          | localhost:8000/api/users                      | Creates a new user.  Expects a JSON payload witht a "useName", "password", "email". Username and email must be unique. If a "role" is also sent in the payload of the request with a value of "administrator", an admin is  created. |
| /api/login                            | POST   | (see comment)      |                          | localhost:8000/api/login                      | Generates a JWT.  Expects a JSON payload with a "userName" and "password" fields.                                                                                                                                                    |
| /api/logout                           | POST   | JWT                |                          | localhost:8000/api/logout                     | Blacklists a JWT                                                                                                                                                                                                                     |