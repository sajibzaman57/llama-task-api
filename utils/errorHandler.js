function handleMongooseError(err, res) {
    if (
        err.name === 'CastError' ||
        err.name === 'ValidationError' ||
        err.name === 'MongoServerError' && err.code === 11000
    ) {

        res.status(400).json({
            message: 'Bad Request',
            data: err.message || 'Invalid input or query parameters'
        });
    } else {

        res.status(500).json({
            message: 'Internal Server Error',
            data: err.message || 'Something went wrong on the server'
        });
    }
}

module.exports = handleMongooseError;