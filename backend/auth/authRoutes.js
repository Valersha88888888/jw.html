const express = require("express");

const router = express.Router();

const {

    register,
    signIn

} = require("./authController");

router.post(

    "/register",

    register

);

router.post(

    "/login",

    signIn

);

module.exports = router;