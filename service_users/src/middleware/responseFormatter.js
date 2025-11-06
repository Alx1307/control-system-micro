const formatResponse = (req, res, next) => {
    res.success = (data, message = null, statusCode = 200) => {
        const response = { success: true, data };
        if (message) response.message = message;
        res.status(statusCode).json(response);
    };

    res.error = (code, message, statusCode = 400) => {
        res.status(statusCode).json({
            success: false,
            error: {
                code: code,
                message: message
            }
        });
    };

    next();
}

module.exports = formatResponse;