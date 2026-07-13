const { pool } = require("./db");

async function initializeDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS leads (
            id BIGSERIAL PRIMARY KEY,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            status TEXT NOT NULL DEFAULT 'Ny',
            service_type TEXT,
            other_service TEXT,
            size TEXT,
            square_meters TEXT,
            area TEXT,
            other_area TEXT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            notes TEXT,
            offer_number TEXT,
            source TEXT,
            external_lead_id TEXT
        )
    `);

    await pool.query(`
        ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS source TEXT
    `);

    await pool.query(`
        ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS external_lead_id TEXT
    `);

    await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS leads_external_lead_id_unique
        ON leads (external_lead_id)
        WHERE external_lead_id IS NOT NULL
    `);

    console.log("PostgreSQL leads table ready");
}

module.exports = {
    initializeDatabase
};
