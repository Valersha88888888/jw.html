const { saveLead } = require("../services/leadService");
const { validateLead } = require("../validators/leadValidator");
const log = require("../services/logService");
const { runLeadAutomation } = require("../services/leadAutomationService");

function cleanText(value, maxLength = 500) {
    if (typeof value !== "string") {
        return null;
    }

    const cleaned = value.trim();

    if (!cleaned) {
        return null;
    }

    return cleaned.slice(0, maxLength);
}

async function createPublicLead(req, res) {
    try {
        const payload = {
            status: "Ny",
            serviceType: cleanText(req.body.serviceType, 100),
            otherService: cleanText(req.body.otherService, 300),
            size: cleanText(req.body.size, 50),
            squareMeters: cleanText(req.body.squareMeters, 50),
            area: cleanText(req.body.area, 100),
            otherArea: cleanText(req.body.otherArea, 100),
            name: cleanText(req.body.name, 150),
            phone: cleanText(req.body.phone, 50),
            email: cleanText(req.body.email, 200),
            notes: cleanText(req.body.notes, 1000),
            source: "Website – Facebook/Instagram Ads"
        };

        const validation = validateLead(payload);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }

        const lead = await saveLead(payload);

        const automationResults =
            await runLeadAutomation(lead);

        const failedAutomations =
            automationResults.filter(
                (result) => result.status === "rejected"
            );

        if (failedAutomations.length > 0) {
            log.error(
                `Public lead notification failures: leadId=${lead.id}; count=${failedAutomations.length}`
            );
        }

        log.info(
            `Public lead created: ${lead.name} (${lead.email || ""})`
        );

        return res.status(201).json({
            success: true,
            message: "Tack! Vi kontaktar dig så snart som möjligt.",
            lead: {
                id: lead.id,
                createdAt: lead.createdAt
            }
        });
    } catch (error) {
        log.error(`Public lead failed: ${error.message}`);

        return res.status(500).json({
            success: false,
            message: "Kunde inte skicka förfrågan. Försök igen senare."
        });
    }
}

module.exports = {
    createPublicLead
};
