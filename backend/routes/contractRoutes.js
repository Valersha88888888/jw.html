const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
    createContractController,
    getContractsController,
    getContractController,
    sendContractController,
    deleteContractController,
    archiveContractController
} = require("../controllers/contractController");

router.post(
    "/contracts",
    auth,
    createContractController
);

router.get(
    "/contracts",
    auth,
    getContractsController
);

router.get(
    "/contracts/:id",
    auth,
    getContractController
);

router.post(
    "/contracts/:id/send",
    auth,
    sendContractController
);

router.delete(
    "/contracts/:id",
    auth,
    deleteContractController
);

router.post(
    "/contracts/:id/archive",
    auth,
    archiveContractController
);

module.exports = router;
