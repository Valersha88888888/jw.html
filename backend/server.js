require("dotenv").config();

const express = require("express");
const cors = require("cors");

const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./auth/authRoutes");
const leadRoutes = require("./routes/leadRoutes");
const offerRoutes = require("./routes/offerRoutes");
const customerRoutes = require("./routes/customerRoutes");
const contactRoutes = require("./routes/contactRoutes");
const emailRoutes = require("./routes/emailRoutes");

const app = express();

const PORT = process.env.PORT || 3000;

/* ==========================================
   Middleware
========================================== */

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({

    extended: true

}));

app.use(logger);

/* ==========================================
   Test Routes
========================================== */

app.get("/", (req, res) => {

    res.json({

        success: true,

        application: "J&W Quality Hemservice CRM",

        version: "1.0.0"

    });

});

app.get("/api/test", (req, res) => {

    res.json({

        success: true,

        message: "API fungerar"

    });

});

/* ==========================================
   API Routes
========================================== */

app.use("/api/auth", authRoutes);

app.use("/api", leadRoutes);

app.use("/api", offerRoutes);

app.use("/api", customerRoutes);

app.use("/api", contactRoutes);

app.use("/api", emailRoutes);

/* ==========================================
   Error Handler
========================================== */

app.use(errorHandler);

/* ==========================================
   Server
========================================== */

app.listen(PORT, () => {

    console.log("");

    console.log("====================================");

    console.log(" J&W Quality Hemservice CRM");

    console.log("====================================");

    console.log(` Server running on port ${PORT}`);

    console.log(` http://localhost:${PORT}`);

    console.log("====================================");

});