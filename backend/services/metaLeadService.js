const { saveLead } = require("./leadService");
const { mapMetaLead } = require("../utils/metaFieldMapper");
const log = require("./logService");

function getMetaConfig() {
    const graphApiVersion = process.env.META_GRAPH_API_VERSION;
    const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;

    if (!graphApiVersion) {
        throw new Error("META_GRAPH_API_VERSION is missing");
    }

    if (!pageAccessToken) {
        throw new Error("META_PAGE_ACCESS_TOKEN is missing");
    }

    return {
        graphApiVersion,
        pageAccessToken
    };
}

async function fetchMetaLead(leadId) {
    if (!leadId) {
        throw new Error("Meta lead ID is missing");
    }

    const {
        graphApiVersion,
        pageAccessToken
    } = getMetaConfig();

    const fields = [
        "id",
        "created_time",
        "field_data",
        "form_id",
        "ad_id",
        "adset_id",
        "campaign_id",
        "platform"
    ].join(",");

    const url = new URL(
        `https://graph.facebook.com/${graphApiVersion}/${encodeURIComponent(leadId)}`
    );

    url.searchParams.set("fields", fields);
    url.searchParams.set("access_token", pageAccessToken);

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json"
        }
    });

    const data = await response.json();

    if (!response.ok) {
        const metaMessage =
            data?.error?.message ||
            `Meta Graph API returned HTTP ${response.status}`;

        throw new Error(metaMessage);
    }

    return data;
}

async function importMetaLead(leadId) {
    const metaLead = await fetchMetaLead(leadId);
    const mappedLead = mapMetaLead(metaLead);
    const savedLead = await saveLead(mappedLead);

    if (!savedLead) {
        log.info(`Duplicate Meta lead ignored: ${leadId}`);

        return {
            duplicate: true,
            lead: null
        };
    }

    log.info(
        `Meta lead imported: ${savedLead.name} (${savedLead.source})`
    );

    return {
        duplicate: false,
        lead: savedLead
    };
}

module.exports = {
    fetchMetaLead,
    importMetaLead
};
