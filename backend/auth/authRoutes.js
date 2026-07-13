const { signIn } = require("./authController");
const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "För många inloggningsförsök. Försök igen om 10 minuter."
    }
});

router.post(
    "/login",
    loginLimiter,
    signIn
);

module.exports = router;
