const crypto = require("crypto");

const { importMetaLead } = require("../services/metaLeadService");
const log = require("../services/logService");

function verifyWebhook(req, res) {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (!process.env.META_VERIFY_TOKEN) {
        log.error("META_VERIFY_TOKEN is missing");

        return res.sendStatus(500);
    }

    if (
        mode === "subscribe" &&
        token === process.env.META_VERIFY_TOKEN
    ) {
        log.info("Meta webhook verified");

        return res.status(200).send(challenge);
    }

    log.error("Meta webhook verification failed");

    return res.sendStatus(403);
}

function isValidSignature(req) {
    const appSecret = process.env.META_APP_SECRET;
    const signatureHeader = req.get("x-hub-signature-256");

    if (!appSecret || !signatureHeader || !req.rawBody) {
        return false;
    }

    const expectedSignature =
        "sha256=" +
        crypto
            .createHmac("sha256", appSecret)
            .update(req.rawBody)
            .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(signatureHeader);

    if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
    );
}

function extractLeadIds(body) {
    if (!body || body.object !== "page" || !Array.isArray(body.entry)) {
        return [];
    }

    const leadIds = [];

    for (const entry of body.entry) {
        if (!Array.isArray(entry.changes)) {
            continue;
        }

        for (const change of entry.changes) {
            if (
                change.field === "leadgen" &&
                change.value &&
                change.value.leadgen_id
            ) {
                leadIds.push(String(change.value.leadgen_id));
            }
        }
    }

    return [...new Set(leadIds)];
}

async function processLeadIds(leadIds) {
    const results = await Promise.allSettled(
        leadIds.map((leadId) => importMetaLead(leadId))
    );

    results.forEach((result, index) => {
        const leadId = leadIds[index];

        if (result.status === "rejected") {
            log.error(
                `Meta lead import failed (${leadId}): ${result.reason.message}`
            );
        }
    });
}

function receiveWebhook(req, res) {
    log.info(
        `Meta signature diagnostic: sha256=${Boolean(
            req.get("x-hub-signature-256")
        )}, sha1=${Boolean(
            req.get("x-hub-signature")
        )}, rawBody=${Boolean(
            req.rawBody
        )}, bytes=${req.rawBody ? req.rawBody.length : 0}`
    );
    if (!isValidSignature(req)) {
        log.error("Invalid Meta webhook signature");

        return res.sendStatus(401);
    }

    const leadIds = extractLeadIds(req.body);

    res.sendStatus(200);

    if (leadIds.length === 0) {
        log.info("Meta webhook received without lead IDs");
        return;
    }

    log.info(
        `Meta webhook received (${leadIds.length} lead ID)`
    );

    processLeadIds(leadIds).catch((error) => {
        log.error(`Meta webhook processing failed: ${error.message}`);
    });
}

module.exports = {
    verifyWebhook,
    receiveWebhook
};
