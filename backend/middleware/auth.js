const jwt = require("jsonwebtoken");

function auth(req, res, next) {

    const header = req.headers.authorization;

    if (!header) {

        return res.status(401).json({
            success: false,
            message: "Missing token"
        });

    }

    const token = header.replace("Bearer ", "");

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });

    }

}

module.exports = auth;