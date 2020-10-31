const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    userName: {
        type: String,
        required: true,
        unique: true
    },
    likedMovies: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Movie'
        }
    ],
    role: {
        type: String,
        default: 'user'
    },
    rentals: [
        {
            movie: {type: mongoose.SchemaTypes.ObjectId, ref: 'Movie'},
            rentalDate: Number, /* a number equivalent to Date.now() */
            returnDate: Number, /* a number equivalent to Date.now() */
        }
    ],
    purchases: [
        {
            movie: {type: mongoose.SchemaTypes.ObjectId, ref: 'Movie'},
            purchaseDate: Number /* a number equivalent to Date.now() */
        }
    ],
    passwordHash: String,
    overdueTax: Number
})

userSchema.plugin(uniqueValidator)

userSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        delete returnedObject.passwordHash
        delete returnedObject.role
    }
})

module.exports = mongoose.model('User', userSchema)