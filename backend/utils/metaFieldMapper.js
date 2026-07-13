function normalizeFieldName(name) {
    return String(name || "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");
}

function getFirstValue(field) {
    if (!field || !Array.isArray(field.values)) {
        return null;
    }

    const value = field.values[0];

    if (value === undefined || value === null) {
        return null;
    }

    return String(value).trim() || null;
}

function fieldDataToObject(fieldData = []) {
    return fieldData.reduce((result, field) => {
        const key = normalizeFieldName(field.name);
        const value = getFirstValue(field);

        if (key && value !== null) {
            result[key] = value;
        }

        return result;
    }, {});
}

function findFirst(fields, possibleNames) {
    for (const name of possibleNames) {
        const normalizedName = normalizeFieldName(name);

        if (fields[normalizedName]) {
            return fields[normalizedName];
        }
    }

    return null;
}

function detectSource(leadData = {}) {
    const platform = String(leadData.platform || "").toLowerCase();

    if (platform.includes("instagram")) {
        return "Instagram";
    }

    if (platform.includes("facebook")) {
        return "Facebook";
    }

    return "Meta";
}

function mapMetaLead(leadData = {}) {
    const fields = fieldDataToObject(leadData.field_data);

    const firstName = findFirst(fields, [
        "first_name",
        "firstname",
        "förnamn",
        "fornamn"
    ]);

    const lastName = findFirst(fields, [
        "last_name",
        "lastname",
        "efternamn"
    ]);

    const fullName = findFirst(fields, [
        "full_name",
        "name",
        "namn",
        "fullständigt_namn",
        "fullstandigt_namn"
    ]);

    const combinedName = [firstName, lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

    const name =
        fullName ||
        combinedName ||
        "Meta lead";

    const phone = findFirst(fields, [
        "phone_number",
        "phone",
        "telefon",
        "telefonnummer",
        "mobile_phone",
        "mobilnummer"
    ]);

    const email = findFirst(fields, [
        "email",
        "e_mail",
        "e-post",
        "epost"
    ]);

    const serviceType = findFirst(fields, [
        "service_type",
        "service",
        "tjänst",
        "tjanst",
        "vilken_tjänst_är_du_intresserad_av",
        "vilken_tjanst_ar_du_intresserad_av",
        "typ_av_städning",
        "typ_av_stadning"
    ]);

    const squareMeters = findFirst(fields, [
        "square_meters",
        "kvadratmeter",
        "bostadens_storlek",
        "storlek_i_kvadratmeter",
        "yta"
    ]);

    const area = findFirst(fields, [
        "area",
        "område",
        "omrade",
        "city",
        "stad",
        "ort",
        "postort"
    ]);

    const address = findFirst(fields, [
        "address",
        "adress",
        "street_address",
        "gatuadress"
    ]);

    const postalCode = findFirst(fields, [
        "post_code",
        "postal_code",
        "postnummer",
        "zip_code"
    ]);

    const message = findFirst(fields, [
        "message",
        "meddelande",
        "comments",
        "kommentar",
        "övrigt",
        "ovrigt"
    ]);

    const mappedKeys = new Set([
        "first_name",
        "firstname",
        "förnamn",
        "fornamn",
        "last_name",
        "lastname",
        "efternamn",
        "full_name",
        "name",
        "namn",
        "fullständigt_namn",
        "fullstandigt_namn",
        "phone_number",
        "phone",
        "telefon",
        "telefonnummer",
        "mobile_phone",
        "mobilnummer",
        "email",
        "e_mail",
        "e-post",
        "epost",
        "service_type",
        "service",
        "tjänst",
        "tjanst",
        "vilken_tjänst_är_du_intresserad_av",
        "vilken_tjanst_ar_du_intresserad_av",
        "typ_av_städning",
        "typ_av_stadning",
        "square_meters",
        "kvadratmeter",
        "bostadens_storlek",
        "storlek_i_kvadratmeter",
        "yta",
        "area",
        "område",
        "omrade",
        "city",
        "stad",
        "ort",
        "postort",
        "address",
        "adress",
        "street_address",
        "gatuadress",
        "post_code",
        "postal_code",
        "postnummer",
        "zip_code",
        "message",
        "meddelande",
        "comments",
        "kommentar",
        "övrigt",
        "ovrigt"
    ]);

    const extraFields = Object.entries(fields)
        .filter(([key]) => !mappedKeys.has(key))
        .map(([key, value]) => `${key}: ${value}`);

    const noteParts = [
        "Lead imported automatically from Meta.",
        leadData.form_id ? `Form ID: ${leadData.form_id}` : null,
        leadData.ad_id ? `Ad ID: ${leadData.ad_id}` : null,
        leadData.adset_id ? `Ad set ID: ${leadData.adset_id}` : null,
        leadData.campaign_id ? `Campaign ID: ${leadData.campaign_id}` : null,
        address ? `Adress: ${address}` : null,
        postalCode ? `Postnummer: ${postalCode}` : null,
        message ? `Meddelande: ${message}` : null,
        extraFields.length
            ? `Övriga formulärfält: ${extraFields.join("; ")}`
            : null
    ].filter(Boolean);

    return {
        status: "Ny",
        source: detectSource(leadData),
        externalLeadId: String(leadData.id),
        name,
        phone,
        email,
        serviceType,
        squareMeters,
        area,
        notes: noteParts.join("\n")
    };
}

module.exports = {
    mapMetaLead,
    fieldDataToObject,
    detectSource
};
