const express = require("express");

const router = express.Router();

const {

    getAll,
    getOne,
    create,
    update,
    remove

} = require("../controllers/customerController");

const auth = require("../middleware/authMiddleware");

/* ==============================
   Customers
============================== */

router.get(

    "/customers",

    auth,

    getAll

);

router.get(

    "/customers/:id",

    auth,

    getOne

);

router.post(

    "/customers",

    auth,

    create

);

router.put(

    "/customers/:id",

    auth,

    update

);

router.delete(

    "/customers/:id",

    auth,

    remove

);

module.exports = router;