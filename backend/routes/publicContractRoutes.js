const express =
    require("express");

const rateLimit =
    require("express-rate-limit");

const {
    getPublicContractController,
    requestOtpController,
    verifyOtpController,
    signContractController
} = require(
    "../controllers/publicContractController"
);

const router =
    express.Router();


/*
 * =========================================================
 * PUBLIC CONTRACT
 * =========================================================
 */

const publicContractLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        limit:
            100,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message: {
            success:
                false,

            message:
                "För många förfrågningar. Försök igen senare."
        }
    });


/*
 * =========================================================
 * OTP REQUEST
 * =========================================================
 */

const otpRequestLimiter =
    rateLimit({
        windowMs:
            10 * 60 * 1000,

        limit:
            5,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message: {
            success:
                false,

            message:
                "För många verifieringskoder har begärts. Försök igen senare."
        }
    });


/*
 * =========================================================
 * OTP VERIFY
 * =========================================================
 */

const otpVerifyLimiter =
    rateLimit({
        windowMs:
            10 * 60 * 1000,

        limit:
            10,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message: {
            success:
                false,

            message:
                "För många verifieringsförsök. Försök igen senare."
        }
    });


/*
 * =========================================================
 * ELECTRONIC SIGNING
 * =========================================================
 */

const signLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        limit:
            10,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message: {
            success:
                false,

            message:
                "För många signeringsförsök. Vänta en stund och försök igen."
        }
    });


/*
 * =========================================================
 * ROUTES
 * =========================================================
 */

router.get(
    "/contracts/:token",
    publicContractLimiter,
    getPublicContractController
);


router.post(
    "/contracts/:token/otp/request",
    otpRequestLimiter,
    requestOtpController
);


router.post(
    "/contracts/:token/otp/verify",
    otpVerifyLimiter,
    verifyOtpController
);


router.post(
    "/contracts/:token/sign",
    signLimiter,
    signContractController
);


module.exports =
    router;