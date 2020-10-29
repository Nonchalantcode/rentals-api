const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 1,
        unique: true
    },
    description: {
        type: String,
        minlength: 50,
        required: true
    },
    posters: {
        type: [String],
        minlength: 1,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    rentalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    salePrice: {
        type: Number,
        required: true,
        min: 0
    },
    availability: {
        type: Boolean,
        required: true
    }
})

movieSchema.plugin(uniqueValidator)

movieSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

module.exports = mongoose.model('Movie', movieSchema)