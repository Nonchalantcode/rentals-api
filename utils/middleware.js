const unknownEndpoint = (request, response) => {
    response.status(404).send({error: "unknown endpoint"})
}

const errorHandler = (error, request, response, next) => {
    if(error.name === 'JsonWebTokenError') {
        return response.status(401).json({
            error: 'token missing or invalid'
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
    if(error.name === 'TypeError') {
        return response.status(500).json({
            error: 'Internal server error'
        })
    }
    next(error)
}

module.exports = {
    unknownEndpoint, errorHandler
}