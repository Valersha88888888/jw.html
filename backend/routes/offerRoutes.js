const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {

    generateOffer,
    getOffers

} = require("../controllers/offerController");

router.post(

    "/generate-offer",

    auth,

    generateOffer

);

router.get(

    "/offers",

    auth,

    getOffers

);

module.exports = router;