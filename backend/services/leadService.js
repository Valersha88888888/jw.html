const { pool } = require("../config/db");

function mapLead(row) {
    return {
        id: row.id,
        createdAt: row.created_at,
        status: row.status,
        serviceType: row.service_type,
        otherService: row.other_service,
        size: row.size,
        squareMeters: row.square_meters,
        area: row.area,
        otherArea: row.other_area,
        name: row.name,
        phone: row.phone,
        email: row.email,
        notes: row.notes,
        offerNumber: row.offer_number
    };
}

async function getAllLeads() {
    const result = await pool.query(`
        SELECT *
        FROM leads
        ORDER BY created_at ASC
    `);

    return result.rows.map(mapLead);
}

async function saveLead(lead) {
    const result = await pool.query(
        `
        INSERT INTO leads (
            status,
            service_type,
            other_service,
            size,
            square_meters,
            area,
            other_area,
            name,
            phone,
            email,
            notes,
            offer_number
        )
        VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12
        )
        RETURNING *
        `,
        [
            lead.status || "Ny",
            lead.serviceType || null,
            lead.otherService || null,
            lead.size || null,
            lead.squareMeters || null,
            lead.area || null,
            lead.otherArea || null,
            lead.name,
            lead.phone || null,
            lead.email || null,
            lead.notes || null,
            lead.offerNumber || null
        ]
    );

    return mapLead(result.rows[0]);
}

async function updateLeadById(id, updatedData) {
    const existingResult = await pool.query(
        `
        SELECT *
        FROM leads
        WHERE id = $1
        `,
        [id]
    );

    if (existingResult.rowCount === 0) {
        throw new Error("Lead not found");
    }

    const existing = mapLead(existingResult.rows[0]);

    await pool.query(
        `
        UPDATE leads
        SET
            status = $2,
            service_type = $3,
            other_service = $4,
            size = $5,
            square_meters = $6,
            area = $7,
            other_area = $8,
            name = $9,
            phone = $10,
            email = $11,
            notes = $12,
            offer_number = $13
        WHERE id = $1
        `,
        [
            id,
            updatedData.status ?? existing.status,
            updatedData.serviceType ?? existing.serviceType,
            updatedData.otherService ?? existing.otherService,
            updatedData.size ?? existing.size,
            updatedData.squareMeters ?? existing.squareMeters,
            updatedData.area ?? existing.area,
            updatedData.otherArea ?? existing.otherArea,
            updatedData.name ?? existing.name,
            updatedData.phone ?? existing.phone,
            updatedData.email ?? existing.email,
            updatedData.notes ?? existing.notes,
            updatedData.offerNumber ?? existing.offerNumber
        ]
    );
}

async function deleteLeadById(id) {
    const result = await pool.query(
        `
        DELETE FROM leads
        WHERE id = $1
        `,
        [id]
    );

    if (result.rowCount === 0) {
        throw new Error("Lead not found");
    }
}

function generateOfferNumber() {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);

    return `JW-${year}-${timestamp}`;
}

module.exports = {
    getAllLeads,
    saveLead,
    updateLeadById,
    deleteLeadById,
    generateOfferNumber
};
