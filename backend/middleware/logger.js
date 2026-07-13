function logger(req, res, next) {

    const now = new Date();

    console.log(
        `[${now.toLocaleString()}] ${req.method} ${req.originalUrl}`
    );

    next();

}

module.exports = logger;