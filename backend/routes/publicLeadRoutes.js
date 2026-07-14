const express = require("express");
const rateLimit = require("express-rate-limit");

const {
    createPublicLead
} = require("../controllers/publicLeadController");

const router = express.Router();

const publicLeadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "För många förfrågningar. Försök igen senare."
    }
});

router.post(
    "/leads",
    publicLeadLimiter,
    createPublicLead
);

module.exports = router;
