const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const bannedTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    userName: {
        type: String,
        required: true,
    }
})

bannedTokenSchema.plugin(uniqueValidator)

bannedTokenSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

module.exports = mongoose.model('BannedToken', bannedTokenSchema)