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

    await pool.query(`
        CREATE TABLE IF NOT EXISTS contracts (
            id BIGSERIAL PRIMARY KEY,

            contract_number TEXT NOT NULL UNIQUE,

            customer_id BIGINT,
            lead_id BIGINT,
            offer_id TEXT,
            offer_number TEXT,

            customer_first_name TEXT NOT NULL,
            customer_last_name TEXT NOT NULL,
            customer_personnummer TEXT,

            customer_address TEXT,
            customer_postal_code TEXT,
            customer_city TEXT,

            customer_phone TEXT,
            customer_email TEXT NOT NULL,

            service_address TEXT NOT NULL,
            service_postal_code TEXT,
            service_city TEXT,

            service_area_m2 NUMERIC(10,2),
            service_frequency TEXT,
            service_hours NUMERIC(10,2),
            service_day TEXT,
            service_time TEXT,

            start_date DATE,

            intro_price NUMERIC(10,2) NOT NULL DEFAULT 149.00,
            intro_cleanings INTEGER NOT NULL DEFAULT 3,
            regular_price NUMERIC(10,2) NOT NULL DEFAULT 250.00,

            prices_after_rut BOOLEAN NOT NULL DEFAULT TRUE,

            binding_months INTEGER NOT NULL DEFAULT 12,
            termination_days INTEGER NOT NULL DEFAULT 30,
            cancellation_hours INTEGER NOT NULL DEFAULT 24,

            contract_version INTEGER NOT NULL DEFAULT 1,
            contract_text TEXT,
            contract_hash TEXT,
            offer_snapshot JSONB,

            status TEXT NOT NULL DEFAULT 'draft',

            public_token TEXT UNIQUE,
            token_expires_at TIMESTAMPTZ,

            sent_at TIMESTAMPTZ,
            opened_at TIMESTAMPTZ,

            bankid_order_ref TEXT,
            bankid_signature TEXT,
            bankid_ocsp_response TEXT,

            signed_name TEXT,
            signed_personnummer TEXT,
            signed_at TIMESTAMPTZ,

            pdf_path TEXT,
            pdf_hash TEXT,

            company_approved BOOLEAN NOT NULL DEFAULT TRUE,
            company_approved_name TEXT NOT NULL DEFAULT 'J&W Quality Hemservice',

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS contracts_status_idx
        ON contracts (status)
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS contracts_customer_email_idx
        ON contracts (customer_email)
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS contracts_created_at_idx
        ON contracts (created_at DESC)
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS contract_events (
            id BIGSERIAL PRIMARY KEY,

            contract_id BIGINT NOT NULL
                REFERENCES contracts(id)
                ON DELETE CASCADE,

            event_type TEXT NOT NULL,

            description TEXT,

            metadata JSONB,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS contract_events_contract_id_idx
        ON contract_events (contract_id, created_at)
    `);


    await pool.query(`
        ALTER TABLE contracts
        ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ
    `);

    await pool.query(`
        ALTER TABLE contracts
        ADD COLUMN IF NOT EXISTS archived_reason TEXT
    `);

    await pool.query(`
        ALTER TABLE contracts
        ADD COLUMN IF NOT EXISTS archived_by TEXT
    `);

    await pool.query(`
        ALTER TABLE contracts
        ADD COLUMN IF NOT EXISTS bankid_qr_start_token TEXT
    `);

    await pool.query(`
        ALTER TABLE contracts
        ADD COLUMN IF NOT EXISTS bankid_qr_start_secret TEXT
    `);

    await pool.query(`
        ALTER TABLE contracts
        ADD COLUMN IF NOT EXISTS bankid_started_at TIMESTAMPTZ
    `);
    console.log("PostgreSQL contracts table ready");
    console.log("PostgreSQL contract_events table ready");
}

module.exports = {
    initializeDatabase
};
