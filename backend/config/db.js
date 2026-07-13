const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
}

const databaseUrl = new URL(process.env.DATABASE_URL);

const isRenderDatabase =
    databaseUrl.hostname.endsWith(".render.com");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isRenderDatabase
        ? {
            rejectUnauthorized: false
        }
        : false,
    connectionTimeoutMillis: 15000
});

pool.on("error", (error) => {
    console.error(
        "Unexpected PostgreSQL pool error:",
        error.message
    );
});

async function testDatabaseConnection() {
    const client = await pool.connect();

    try {
        const result = await client.query(
            "SELECT NOW() AS current_time"
        );

        console.log(
            "PostgreSQL connected:",
            result.rows[0].current_time
        );
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    testDatabaseConnection
};
