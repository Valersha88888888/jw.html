require("dotenv").config();

const express = require("express");

// ===== PUPPETEER DIAGNOSTIC =====
try {
    const puppeteer = require("puppeteer");

    console.log("===== PUPPETEER DIAGNOSTIC =====");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log(
        "PUPPETEER_CACHE_DIR:",
        process.env.PUPPETEER_CACHE_DIR || "(not set)"
    );
    console.log(
        "PUPPETEER_EXECUTABLE_PATH:",
        process.env.PUPPETEER_EXECUTABLE_PATH || "(not set)"
    );

    try {
        console.log(
            "PUPPETEER EXECUTABLE:",
            puppeteer.executablePath()
        );
    } catch (error) {
        console.log(
            "PUPPETEER EXECUTABLE ERROR:",
            error.message
        );
    }

    console.log("===============================");
} catch (error) {
    console.log(
        "PUPPETEER DIAGNOSTIC ERROR:",
        error.message
    );
}
// ===== END PUPPETEER DIAGNOSTIC =====
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./auth/authRoutes");
const leadRoutes = require("./routes/leadRoutes");
const publicLeadRoutes = require("./routes/publicLeadRoutes");
const publicContractRoutes = require("./routes/publicContractRoutes");
const offerRoutes = require("./routes/offerRoutes");
const customerRoutes = require("./routes/customerRoutes");
const contractRoutes = require("./routes/contractRoutes");
const contactRoutes = require("./routes/contactRoutes");
const emailRoutes = require("./routes/emailRoutes");
const metaWebhookRoutes = require("./routes/metaWebhookRoutes");

const { testDatabaseConnection } = require("./config/db");
const { initializeDatabase } = require("./config/initDatabase");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                upgradeInsecureRequests: null,
                scriptSrc: [
                    "'self'",
                    "https://connect.facebook.net",
                    "https://cdn.jsdelivr.net"
                ],

                scriptSrcAttr: [
                    "'unsafe-inline'"
                ],

                connectSrc: [
                    "'self'",
                    "https://connect.facebook.net",
                    "https://www.facebook.com"
                ],

                imgSrc: [
                    "'self'",
                    "data:",
                    "https://www.facebook.com"
                ],

                frameSrc: [
                    "'self'",
                    "https://www.facebook.com"
                ]
            }
        }
    })
);

app.use(cors());

app.use(
    express.json({
        verify: (req, res, buffer) => {
            req.rawBody = buffer;
        }
    })
);

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    express.static(
        path.join(__dirname, "../frontend")
    )
);

app.use(logger);

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

app.use("/api/auth", authRoutes);
app.use("/api/meta", metaWebhookRoutes);
app.use("/api/public", publicLeadRoutes);
app.use("/api/public", publicContractRoutes);
app.use("/api", leadRoutes);
app.use("/api", offerRoutes);
app.use("/api", customerRoutes);
app.use("/api", contractRoutes);
app.use("/api", contactRoutes);
app.use("/api", emailRoutes);

app.use(errorHandler);

let httpServer = null;

async function startServer() {
    try {
        await testDatabaseConnection();
        await initializeDatabase();

        console.log(
            "Database initialization completed."
        );

        httpServer = app.listen(
            PORT,
            "0.0.0.0"
        );

        httpServer.ref();

        httpServer.on(
            "listening",
            () => {
                const address =
                    httpServer.address();

                console.log("");
                console.log(
                    "===================================="
                );
                console.log(
                    " J&W Quality Hemservice CRM"
                );
                console.log(
                    "===================================="
                );
                console.log(
                    ` Server running on port ${PORT}`
                );
                console.log(
                    ` http://localhost:${PORT}`
                );
                console.log(
                    ` Network: http://192.168.0.57:${PORT}`
                );
                console.log(
                    "===================================="
                );

                console.log(
                    "HTTP server address:",
                    address
                );
            }
        );

        httpServer.on(
            "error",
            (error) => {
                console.error(
                    "HTTP SERVER ERROR:"
                );

                console.error(error);
            }
        );

        httpServer.on(
            "close",
            () => {
                console.error(
                    "HTTP SERVER CLOSED"
                );
            }
        );

    } catch (error) {
        console.error(
            "Server startup failed:",
            error
        );

        process.exitCode = 1;
    }
}

process.on(
    "uncaughtException",
    (error) => {
        console.error(
            "UNCAUGHT EXCEPTION:",
            error
        );
    }
);

process.on(
    "unhandledRejection",
    (reason) => {
        console.error(
            "UNHANDLED REJECTION:",
            reason
        );
    }
);

process.on(
    "SIGINT",
    () => {
        console.log(
            "Server shutdown requested."
        );

        if (!httpServer) {
            process.exit(0);
            return;
        }

        httpServer.close(
            () => {
                console.log(
                    "HTTP server stopped safely."
                );

                process.exit(0);
            }
        );
    }
);

startServer();
