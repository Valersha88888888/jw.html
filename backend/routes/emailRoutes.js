const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {

    sendEmail

} = require("../controllers/emailController");

router.post(

    "/send-email",

    auth,

    sendEmail

);

module.exports = router;