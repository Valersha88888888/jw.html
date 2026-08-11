const express =
    require("express");

const rateLimit =
    require("express-rate-limit");

const {
    getPublicContractController,
    startBankIdController,
    collectBankIdController,
    getBankIdQrController
} = require("../controllers/publicContractController");

const router =
    express.Router();


const publicContractLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        limit: 100,

        standardHeaders: true,
        legacyHeaders: false,

        message: {
            success: false,
            message:
                "För många förfrågningar. Försök igen senare."
        }
    });


const bankIdStartLimiter =
    rateLimit({
        windowMs:
            10 * 60 * 1000,

        limit: 10,

        standardHeaders: true,
        legacyHeaders: false,

        message: {
            success: false,
            message:
                "För många BankID-försök. Vänta en stund och försök igen."
        }
    });



const bankIdQrLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        limit: 1200,

        standardHeaders: true,
        legacyHeaders: false,

        message: {
            success: false,
            message:
                "För många QR-förfrågningar. Försök igen senare."
        }
    });


const bankIdCollectLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        limit: 600,

        standardHeaders: true,
        legacyHeaders: false,

        message: {
            success: false,
            message:
                "För många BankID-statusförfrågningar. Försök igen senare."
        }
    });
router.get(
    "/contracts/:token",
    publicContractLimiter,
    getPublicContractController
);


router.post(
    "/contracts/:token/bankid/start",
    bankIdStartLimiter,
    startBankIdController
);


router.post(
    "/contracts/:token/bankid/collect",
    bankIdCollectLimiter,
    collectBankIdController
);



router.get(
    "/contracts/:token/bankid/qr",
    bankIdQrLimiter,
    getBankIdQrController
);

module.exports = router;
