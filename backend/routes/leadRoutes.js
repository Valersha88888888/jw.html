const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {

    getLeads,
    createLead,
    updateLead,
    deleteLead

} = require("../controllers/leadController");

router.get(
    "/leads",
    auth,
    getLeads
);

router.post(
    "/leads",
    auth,
    createLead
);

router.put(
    "/leads/:id",
    auth,
    updateLead
);

router.delete(
    "/leads/:id",
    auth,
    deleteLead
);

module.exports = router;

