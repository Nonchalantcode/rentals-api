const unknownEndpoint = (request, response) => {
    response.status(404).send({error: "unknown endpoint"})
}

const errorHandler = (error, request, response, next) => {
    if(error.name === 'JsonWebTokenError') {
        return response.status(401).json({
            error: 'invalid token'
        })
    }
    if(error.name === 'ValidationError') {
        return response.status(401).json({
            error: error.message
        })
    }
    if(error.name === 'CastError') {
        return response.status(400).json({
            error: 'Wrong ID'
        })
    }
    next(error)
}

module.exports = {
    unknownEndpoint, errorHandler
}