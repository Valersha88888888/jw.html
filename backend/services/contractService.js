const crypto = require("crypto");

const { pool } = require("../config/db");

function createPublicToken() {
    return crypto.randomBytes(32).toString("hex");
}

async function generateContractNumber(client) {
    const year = new Date().getFullYear();

    const prefix = `JW-AVTAL-${year}-`;

    const result = await client.query(
        `
        SELECT contract_number
        FROM contracts
        WHERE contract_number LIKE $1
        ORDER BY id DESC
        LIMIT 1
        `,
        [`${prefix}%`]
    );

    let nextNumber = 1;

    if (result.rows.length > 0) {
        const lastContractNumber =
            result.rows[0].contract_number;

        const lastSequence = Number(
            lastContractNumber.split("-").pop()
        );

        if (Number.isFinite(lastSequence)) {
            nextNumber = lastSequence + 1;
        }
    }

    return (
        prefix +
        String(nextNumber).padStart(6, "0")
    );
}

async function addContractEvent(
    client,
    contractId,
    eventType,
    description = null,
    metadata = null
) {
    await client.query(
        `
        INSERT INTO contract_events (
            contract_id,
            event_type,
            description,
            metadata
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
            contractId,
            eventType,
            description,
            metadata
                ? JSON.stringify(metadata)
                : null
        ]
    );
}

async function createContract(data) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const contractNumber =
            await generateContractNumber(client);

        const publicToken =
            createPublicToken();

        const tokenExpiresAt =
            new Date(
                Date.now() +
                30 * 24 * 60 * 60 * 1000
            );

        const result = await client.query(
            `
            INSERT INTO contracts (
                contract_number,

                customer_id,
                lead_id,
                offer_id,
                offer_number,

                customer_first_name,
                customer_last_name,
                customer_personnummer,

                customer_address,
                customer_postal_code,
                customer_city,

                customer_phone,
                customer_email,

                service_address,
                service_postal_code,
                service_city,

                service_area_m2,
                service_frequency,
                service_hours,
                service_day,
                service_time,

                start_date,

                intro_price,
                intro_cleanings,
                regular_price,

                prices_after_rut,

                binding_months,
                termination_days,
                cancellation_hours,

                contract_version,

                status,

                public_token,
                token_expires_at,

                company_approved,
                company_approved_name
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8,
                $9, $10, $11,
                $12, $13,
                $14, $15, $16,
                $17, $18, $19, $20, $21,
                $22,
                $23, $24, $25,
                $26,
                $27, $28, $29,
                $30,
                $31,
                $32, $33,
                $34, $35
            )
            RETURNING *
            `,
            [
                contractNumber,

                data.customerId || null,
                data.leadId || null,
                data.offerId || null,
                data.offerNumber || null,

                data.customerFirstName,
                data.customerLastName,
                data.customerPersonnummer || null,

                data.customerAddress || null,
                data.customerPostalCode || null,
                data.customerCity || null,

                data.customerPhone || null,
                data.customerEmail,

                data.serviceAddress,
                data.servicePostalCode || null,
                data.serviceCity || null,

                data.serviceAreaM2 || null,
                data.serviceFrequency || null,
                data.serviceHours || null,
                data.serviceDay || null,
                data.serviceTime || null,

                data.startDate || null,

                149,
                3,
                250,

                true,

                12,
                30,
                24,

                1,

                "draft",

                publicToken,
                tokenExpiresAt,

                true,
                "J&W Quality Hemservice"
            ]
        );

        const contract = result.rows[0];

        await addContractEvent(
            client,
            contract.id,
            "created",
            "Contract created",
            {
                contractNumber:
                    contract.contract_number
            }
        );

        await client.query("COMMIT");

        return contract;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function getContracts() {
    const result = await pool.query(
        `
        SELECT *
        FROM contracts
        WHERE archived_at IS NULL
        ORDER BY created_at DESC
        `
    );

    return result.rows;
}

async function getContractById(id) {
    const result = await pool.query(
        `
        SELECT *
        FROM contracts
        WHERE id = $1
        LIMIT 1
        `,
        [id]
    );

    return result.rows[0] || null;
}

async function getContractByToken(token) {
    const result = await pool.query(
        `
        SELECT *
        FROM contracts
        WHERE public_token = $1
        LIMIT 1
        `,
        [token]
    );

    return result.rows[0] || null;
}


async function prepareContractForSending(
    id,
    contractText,
    contractHash
) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const currentResult = await client.query(
            `
            SELECT *
            FROM contracts
            WHERE id = $1
            FOR UPDATE
            `,
            [id]
        );

        const current =
            currentResult.rows[0];

        if (!current) {
            throw new Error("Contract not found");
        }

        if (current.status === "signed") {
            throw new Error(
                "Signed contract cannot be sent again"
            );
        }

        const result = await client.query(
            `
            UPDATE contracts
            SET
                contract_text = $2,
                contract_hash = $3,
                status = 'sent',
                sent_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            `,
            [
                id,
                contractText,
                contractHash
            ]
        );

        await addContractEvent(
            client,
            id,
            "sent",
            "Contract prepared and sent to customer",
            {
                contractHash
            }
        );

        await client.query("COMMIT");

        return result.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}


async function deleteDraftContract(id) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(
            `
            SELECT *
            FROM contracts
            WHERE id = $1
            FOR UPDATE
            `,
            [id]
        );

        const contract = result.rows[0];

        if (!contract) {
            throw new Error("Contract not found");
        }

        if (contract.status !== "draft") {
            throw new Error(
                "Only draft contracts can be deleted"
            );
        }

        await client.query(
            `
            DELETE FROM contracts
            WHERE id = $1
            `,
            [id]
        );

        await client.query("COMMIT");

        return contract;

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}


async function archiveContract(
    id,
    archivedBy = "CRM admin",
    reason = "Removed from active CRM view"
) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(
            `
            SELECT *
            FROM contracts
            WHERE id = $1
            FOR UPDATE
            `,
            [id]
        );

        const contract = result.rows[0];

        if (!contract) {
            throw new Error("Contract not found");
        }

        if (contract.status === "draft") {
            throw new Error(
                "Draft contracts must use permanent deletion"
            );
        }

        if (contract.archived_at) {
            throw new Error(
                "Contract is already archived"
            );
        }

        const archivedResult =
            await client.query(
                `
                UPDATE contracts
                SET
                    archived_at = NOW(),
                    archived_by = $2,
                    archived_reason = $3,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
                `,
                [
                    id,
                    archivedBy,
                    reason
                ]
            );

        await addContractEvent(
            client,
            id,
            "archived",
            "Contract removed from active CRM view",
            {
                archivedBy,
                reason,
                previousStatus:
                    contract.status
            }
        );

        await client.query("COMMIT");

        return archivedResult.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}

module.exports = {
    createContract,
    getContracts,
    getContractById,
    getContractByToken,
    addContractEvent,
    prepareContractForSending,
    deleteDraftContract,
    archiveContract
};
