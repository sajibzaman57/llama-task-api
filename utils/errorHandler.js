function handleMongooseError(err, res) {
    if (
        err.name === 'CastError' ||
        err.name === 'ValidationError' ||
        err.name === 'MongoServerError' && err.code === 11000
    ) {

        res.status(400).json({
            message: 'Bad Request',
            error: err.message || 'Invalid input or query parameters'
        });
    } else {

        res.status(500).json({
            message: 'Internal Server Error',
            error: err.message || 'Something went wrong on the server'
        });
    }
}

module.exports = handleMongooseError;