const fs = require("fs");
const path = require("path");

const COLORS = {
    pink: "#C94F79",
    pinkDark: "#A83D62",
    pinkMid: "#D86E94",
    pinkSoft: "#F3B8CB",
    pinkPale: "#FFF7FA",
    pinkUltra: "#FFFDFE",
    border: "#EDC3D1",
    text: "#282226",
    body: "#41393D",
    muted: "#71676C",

    green: "#367664",
    greenDark: "#276353",
    greenPale: "#F2F9F6",
    greenBorder: "#B7D7CE",

    bankid: "#216078"
};

/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function pick(object, ...keys) {
    for (const key of keys) {

        const value = object?.[key];

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {
            return value;
        }
    }

    return "";
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat(
        "sv-SE",
        {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Europe/Stockholm"
        }
    ).format(date);
}

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    const datePart =
        new Intl.DateTimeFormat(
            "sv-SE",
            {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "Europe/Stockholm"
            }
        ).format(date);

    const timePart =
        new Intl.DateTimeFormat(
            "sv-SE",
            {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Stockholm"
            }
        ).format(date);

    return `${datePart} kl. ${timePart}`;
}

function maskPersonnummer(value) {

    const clean =
        String(value || "")
            .replace(/\D/g, "");

    if (clean.length >= 12) {
        return `${clean.slice(0, 8)}-****`;
    }

    if (clean.length === 10) {
        return `${clean.slice(0, 6)}-****`;
    }

    return value || "-";
}

function buildAddress(
    street,
    postalCode,
    city
) {
    return [
        street,
        postalCode,
        city
    ]
        .filter(Boolean)
        .join(", ");
}

/* =========================================================
   ASSETS
========================================================= */

function assetToDataUri(filePath) {

    if (
        !filePath ||
        !fs.existsSync(filePath)
    ) {
        return null;
    }

    const extension =
        path.extname(filePath)
            .toLowerCase();

    let mime = "image/png";

    if (extension === ".svg") {
        mime = "image/svg+xml";
    }

    if (
        extension === ".jpg" ||
        extension === ".jpeg"
    ) {
        mime = "image/jpeg";
    }

    if (extension === ".webp") {
        mime = "image/webp";
    }

    return (
        `data:${mime};base64,` +
        fs.readFileSync(filePath)
            .toString("base64")
    );
}

function findBrandLogo() {

    const candidates = [

        path.join(
            __dirname,
            "../assets/brand/jw-logo.svg"
        ),

        path.join(
            __dirname,
            "../assets/brand/jw-logo.png"
        ),

        path.join(
            __dirname,
            "../../assets/logo.svg"
        ),

        path.join(
            __dirname,
            "../../frontend/images/jw-logo.svg"
        )
    ];

    for (const candidate of candidates) {

        if (!fs.existsSync(candidate)) {
            continue;
        }

        try {

            const stat =
                fs.statSync(candidate);

            if (
                stat.isFile() &&
                stat.size > 200
            ) {
                return assetToDataUri(
                    candidate
                );
            }

        } catch (error) {
            // Continue.
        }
    }

    return null;
}

function findBankIdLogo() {

    const candidates = [

        path.join(
            __dirname,
            "../assets/brand/bankid-logo.svg"
        ),

        path.join(
            __dirname,
            "../assets/brand/bankid-logo.png"
        ),

        path.join(
            __dirname,
            "../assets/bankid-logo.svg"
        ),

        path.join(
            __dirname,
            "../assets/bankid-logo.png"
        )
    ];

    for (const candidate of candidates) {

        if (!fs.existsSync(candidate)) {
            continue;
        }

        try {

            const stat =
                fs.statSync(candidate);

            if (
                stat.isFile() &&
                stat.size > 100
            ) {
                return assetToDataUri(
                    candidate
                );
            }

        } catch (error) {
            // Continue.
        }
    }

    return null;
}

/* =========================================================
   LOGO
========================================================= */

function bubbleLogoFallback() {
    return `
        <div class="fallback-brand">

            <div class="fallback-bubbles">

                <i class="fb fb1"></i>
                <i class="fb fb2"></i>
                <i class="fb fb3"></i>
                <i class="fb fb4"></i>

            </div>

            <div class="fallback-wordmark">
                J&amp;W Quality Hemservice
            </div>

        </div>
    `;
}

function brandLogo() {

    const source =
        findBrandLogo();

    if (!source) {
        return bubbleLogoFallback();
    }

    return `
        <img
            class="brand-logo"
            src="${source}"
            alt="J&W Quality Hemservice"
        >
    `;
}

/* =========================================================
   COMPONENTS
========================================================= */

function infoRow(
    label,
    value
) {
    return `
        <div class="info-row">

            <span class="info-label">
                ${label}
            </span>

            <strong class="info-value">
                ${escapeHtml(value || "-")}
            </strong>

        </div>
    `;
}

function term(
    number,
    title,
    paragraphs
) {

    return `
        <article class="term">

            <div class="term-number">
                ${number}
            </div>

            <div class="term-content">

                <h3>
                    ${title}
                </h3>

                ${paragraphs
                    .map(
                        paragraph => `
                            <p>
                                ${paragraph}
                            </p>
                        `
                    )
                    .join("")}

            </div>

        </article>
    `;
}

function summaryItem(
    icon,
    title,
    value
) {

    return `
        <div class="summary-item">

            <span class="summary-circle">
                ${icon}
            </span>

            <div>

                <strong>
                    ${title}
                </strong>

                <p>
                    ${value}
                </p>

            </div>

        </div>
    `;
}

/* =========================================================
   TEMPLATE
========================================================= */

function buildSignedContractTemplate(
    contract = {}
) {

    const firstName =
        pick(
            contract,
            "customer_first_name",
            "first_name"
        );

    const lastName =
        pick(
            contract,
            "customer_last_name",
            "last_name"
        );

    const customerName =
        [
            firstName,
            lastName
        ]
            .filter(Boolean)
            .join(" ")
        ||
        pick(
            contract,
            "customer_name",
            "name"
        )
        ||
        "Valier Liudmyla";

    const customerPersonnummer =
        pick(
            contract,
            "customer_personnummer",
            "personnummer"
        )
        ||
        "19840911-1260";

    const customerPhone =
        pick(
            contract,
            "customer_phone",
            "phone"
        )
        ||
        "+46760817077";

    const customerEmail =
        pick(
            contract,
            "customer_email",
            "email"
        )
        ||
        "lulululululu1984@gmail.com";

    const customerStreet =
        pick(
            contract,
            "customer_address",
            "address"
        )
        ||
        "Vindryvsbacken 13";

    const customerPostal =
        pick(
            contract,
            "customer_postal_code",
            "postal_code"
        )
        ||
        "165 60";

    const customerCity =
        pick(
            contract,
            "customer_city",
            "city"
        )
        ||
        "Hässelby";

    const customerAddress =
        buildAddress(
            customerStreet,
            customerPostal,
            customerCity
        );

    const serviceStreet =
        pick(
            contract,
            "service_address",
            "cleaning_address"
        )
        ||
        "Härstamning";

    const servicePostal =
        pick(
            contract,
            "service_postal_code",
            "cleaning_postal_code"
        )
        ||
        "16560";

    const serviceCity =
        pick(
            contract,
            "service_city",
            "cleaning_city"
        )
        ||
        "Hässelby";

    const serviceAddress =
        buildAddress(
            serviceStreet,
            servicePostal,
            serviceCity
        );

    const area =
        pick(
            contract,
            "service_area_m2",
            "area_m2",
            "area"
        )
        ||
        "55.00";

    const frequency =
        pick(
            contract,
            "service_frequency",
            "frequency"
        )
        ||
        "Varannan vecka";

    const estimatedHours =
        pick(
            contract,
            "service_hours",
            "estimated_hours",
            "hours"
        )
        ||
        "4.00";

    const weekday =
        pick(
            contract,
            "service_day",
            "weekday"
        )
        ||
        "Fredag";

    const startTime =
        pick(
            contract,
            "service_time",
            "start_time"
        )
        ||
        "09:00";

    const rawStartDate =
        pick(
            contract,
            "start_date",
            "service_start_date"
        );

    const startDate =
        rawStartDate
            ? formatDate(rawStartDate)
            : "8 augusti 2027";

    const contractNumber =
        pick(
            contract,
            "contract_number"
        )
        ||
        "JW-AVTAL-2026-000002";

    const signedAt =
        pick(
            contract,
            "signed_at"
        );

    const signedDate =
        signedAt
            ? formatDate(signedAt)
            : "9 augusti 2026";

    const signedDateTime =
        signedAt
            ? formatDateTime(signedAt)
            : "9 augusti 2026 kl. 20:00";

    const introPrice =
        pick(
            contract,
            "intro_price"
        )
        ||
        149;

    const regularPrice =
        pick(
            contract,
            "regular_price"
        )
        ||
        250;

    const signedName =
        pick(
            contract,
            "signed_name"
        )
        ||
        customerName;

    const signedPersonnummer =
        pick(
            contract,
            "signed_personnummer"
        )
        ||
        customerPersonnummer;

    const version =
        pick(
            contract,
            "contract_version",
            "version"
        )
        ||
        "1";

    const contractHash =
        pick(
            contract,
            "contract_hash",
            "pdf_hash"
        )
        ||
        "fc49fb8ea2c503f1e6199b7eff678975765495e0ffd5634ad47b655437d59db3";

    const bankIdLogo =
        findBankIdLogo();

    return `
<!DOCTYPE html>

<html lang="sv">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1"
>

<title>
    ${escapeHtml(contractNumber)}
</title>

<style>

/* =====================================================
   VARIABLES
===================================================== */

:root {

    --pink:
        ${COLORS.pink};

    --pink-dark:
        ${COLORS.pinkDark};

    --pink-mid:
        ${COLORS.pinkMid};

    --pink-soft:
        ${COLORS.pinkSoft};

    --pink-pale:
        ${COLORS.pinkPale};

    --pink-ultra:
        ${COLORS.pinkUltra};

    --border:
        ${COLORS.border};

    --text:
        ${COLORS.text};

    --body:
        ${COLORS.body};

    --muted:
        ${COLORS.muted};

    --green:
        ${COLORS.green};

    --green-dark:
        ${COLORS.greenDark};

    --green-pale:
        ${COLORS.greenPale};

    --green-border:
        ${COLORS.greenBorder};

    --bankid:
        ${COLORS.bankid};
}

/* =====================================================
   RESET
===================================================== */

* {
    box-sizing: border-box;
}

html,
body {
    margin: 0;
    padding: 0;
}

html {
    background:
        #F3F2F3;
}

body {

    padding:
        30px
        16px;

    color:
        var(--text);

    background:
        linear-gradient(
            180deg,
            #F7F6F7,
            #EEEEF0
        );

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    font-size: 14px;

    line-height: 1.45;

    -webkit-font-smoothing:
        antialiased;

    -webkit-print-color-adjust:
        exact;

    print-color-adjust:
        exact;
}

/* =====================================================
   MAIN DOCUMENT
===================================================== */

.contract {

    position: relative;

    width:
        min(
            100%,
            1080px
        );

    margin:
        0
        auto;

    overflow:
        hidden;

    border:
        1px solid
        #E8E2E5;

    border-radius:
        16px;

    background:
        #FFFFFF;

    box-shadow:
        0
        22px
        65px
        rgba(
            54,
            29,
            40,
            .13
        );
}

/* =====================================================
   HEADER
===================================================== */

.hero {

    position: relative;

    padding:
        25px
        38px
        57px;

    overflow:
        hidden;

    background:

        radial-gradient(
            circle at 88% 6%,
            rgba(
                218,
                112,
                149,
                .09
            ),
            transparent 27%
        ),

        #FFFFFF;
}

.hero-grid {

    position: relative;

    z-index: 5;

    display: grid;

    grid-template-columns:
        minmax(0, 1fr)
        316px;

    gap:
        36px;

    align-items:
        center;
}

/* =====================================================
   REAL LOGO
===================================================== */

.brand-logo {

    display:
        block;

    width:
        auto;

    max-width:
        565px;

    height:
        82px;

    object-fit:
        contain;

    object-position:
        left center;
}

/* fallback */

.fallback-brand {

    display:
        flex;

    align-items:
        center;

    gap:
        17px;
}

.fallback-bubbles {

    position:
        relative;

    width:
        86px;

    height:
        67px;
}

.fb {

    position:
        absolute;

    display:
        block;

    border-radius:
        50%;

    background:

        radial-gradient(
            circle at 30% 23%,
            #FFFFFF 0%,
            #F7C9D8 20%,
            #E77FA2 55%,
            #C84F78 100%
        );

    box-shadow:

        inset
        2px
        2px
        5px
        rgba(
            255,
            255,
            255,
            .8
        ),

        0
        4px
        8px
        rgba(
            151,
            50,
            87,
            .12
        );
}

.fb1 {

    width:
        37px;

    height:
        37px;

    left:
        1px;

    top:
        25px;
}

.fb2 {

    width:
        44px;

    height:
        44px;

    left:
        34px;

    top:
        8px;
}

.fb3 {

    width:
        23px;

    height:
        23px;

    left:
        43px;

    top:
        43px;
}

.fb4 {

    width:
        14px;

    height:
        14px;

    left:
        23px;

    top:
        0;
}

.fallback-wordmark {

    color:
        #272024;

    font-family:
        Georgia,
        "Times New Roman",
        serif;

    font-size:
        44px;

    font-weight:
        700;

    line-height:
        .95;
}

/* =====================================================
   AVTAL CARD
===================================================== */

.avtal-card {

    overflow:
        hidden;

    border:
        1px solid
        var(--border);

    border-radius:
        12px;

    background:
        #FFFFFF;

    box-shadow:
        0
        8px
        24px
        rgba(
            119,
            42,
            72,
            .08
        );
}

.avtal-heading {

    padding:
        12px
        17px;

    text-align:
        center;

    color:
        #FFFFFF;

    background:

        linear-gradient(
            135deg,
            #AB3D64 0%,
            #D4678D 100%
        );
}

.avtal-heading strong {

    display:
        block;

    font-size:
        23px;

    line-height:
        1;
}

.avtal-heading span {

    display:
        block;

    margin-top:
        5px;

    font-size:
        11px;
}

.avtal-body {

    padding:
        14px
        18px;
}

.avtal-row {

    display:
        grid;

    grid-template-columns:
        108px
        minmax(0,1fr);

    gap:
        9px;

    margin-bottom:
        6px;

    font-size:
        12px;
}

.avtal-row:last-child {
    margin-bottom: 0;
}

.avtal-row strong {
    overflow-wrap: anywhere;
}

.status {

    color:
        #30934F;

    font-weight:
        900;
}

/* =====================================================
   WAVES
===================================================== */

.hero-waves {

    position:
        absolute;

    left:
        0;

    right:
        0;

    bottom:
        0;

    height:
        52px;

    pointer-events:
        none;
}

.wave {

    position:
        absolute;

    left:
        -8%;

    width:
        116%;

    border-radius:
        50%;
}

.wave-a {

    height:
        47px;

    bottom:
        4px;

    border-bottom:
        9px solid
        rgba(
            194,
            66,
            106,
            .82
        );

    transform:
        rotate(-1.2deg);
}

.wave-b {

    height:
        38px;

    bottom:
        14px;

    border-bottom:
        4px solid
        rgba(
            240,
            158,
            185,
            .78
        );

    transform:
        rotate(1.6deg);
}

/* bubbles near wave */

.hero-bubbles {

    position:
        absolute;

    right:
        34%;

    bottom:
        11px;

    width:
        110px;

    height:
        45px;

    opacity:
        .35;
}

.hero-bubble {

    position:
        absolute;

    border:
        2px solid
        rgba(
            210,
            92,
            132,
            .55
        );

    border-radius:
        50%;

    background:
        rgba(
            255,
            255,
            255,
            .45
        );
}

.hb1 {

    width:
        19px;

    height:
        19px;

    left:
        4px;

    top:
        18px;
}

.hb2 {

    width:
        33px;

    height:
        33px;

    left:
        28px;

    top:
        2px;
}

.hb3 {

    width:
        14px;

    height:
        14px;

    left:
        68px;

    top:
        20px;
}

/* =====================================================
   CONTENT
===================================================== */

.content {

    padding:
        20px
        38px
        27px;
}

/* =====================================================
   CUSTOMER / SERVICE CARDS
===================================================== */

.info-grid {

    display:
        grid;

    grid-template-columns:
        1fr
        1fr;

    gap:
        17px;
}

.info-card {

    position:
        relative;

    overflow:
        hidden;

    border:
        1px solid
        var(--border);

    border-radius:
        11px;

    background:
        #FFFFFF;
}

.info-heading {

    display:
        flex;

    align-items:
        center;

    gap:
        9px;

    padding:
        12px
        15px;

    color:
        var(--pink-dark);

    border-bottom:
        1px solid
        var(--border);

    background:

        linear-gradient(
            180deg,
            #FFFDFE,
            #FFF8FA
        );

    font-size:
        13px;

    font-weight:
        900;

    text-transform:
        uppercase;
}

.info-icon {

    display:
        inline-flex;

    align-items:
        center;

    justify-content:
        center;

    width:
        27px;

    height:
        27px;

    flex:
        0
        0 auto;

    border-radius:
        50%;

    color:
        #FFFFFF;

    background:

        linear-gradient(
            180deg,
            #DC7398,
            #BC4871
        );

    font-size:
        13px;
}

.info-body {

    padding:
        14px
        16px;
}

.info-row {

    display:
        grid;

    grid-template-columns:
        135px
        minmax(0,1fr);

    gap:
        10px;

    margin-bottom:
        6px;

    font-size:
        12px;

    line-height:
        1.25;
}

.info-row:last-child {
    margin-bottom: 0;
}

.info-label {

    color:
        var(--muted);
}

.info-value {

    min-width:
        0;

    overflow-wrap:
        anywhere;
}

/* =====================================================
   KPI / PRICE STRIP
===================================================== */

.kpi-grid {

    display:
        grid;

    grid-template-columns:
        repeat(4,1fr);

    margin-top:
        18px;

    overflow:
        hidden;

    border:
        1px solid
        var(--border);

    border-radius:
        12px;

    background:

        linear-gradient(
            180deg,
            #FFFFFF,
            #FFF9FB
        );
}

.kpi {

    display:
        grid;

    grid-template-columns:
        55px
        minmax(0,1fr);

    gap:
        10px;

    align-items:
        center;

    padding:
        17px
        14px;
}

.kpi + .kpi {

    border-left:
        1px solid
        var(--border);
}

.kpi-icon {

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    width:
        49px;

    height:
        49px;

    color:
        var(--pink);

    border:
        1px solid
        #EEC0CF;

    border-radius:
        50%;

    background:

        radial-gradient(
            circle at 30% 25%,
            #FFFFFF,
            #FFF1F5
        );

    font-size:
        21px;
}

.kpi-value {

    color:
        var(--pink-dark);

    font-size:
        16px;

    font-weight:
        900;
}

.kpi-label {

    margin-top:
        3px;

    color:
        var(--pink-dark);

    font-size:
        8.5px;

    font-weight:
        900;

    letter-spacing:
        .25px;

    text-transform:
        uppercase;
}

.kpi-description {

    margin-top:
        5px;

    color:
        var(--body);

    font-size:
        8.8px;

    line-height:
        1.28;
}

/* =====================================================
   AVTALSVILLKOR HEADER
===================================================== */

.terms-heading {

    display:
        flex;

    align-items:
        center;

    gap:
        12px;

    margin:
        23px
        0
        16px;
}

.terms-heading::before,
.terms-heading::after {

    content:
        "";

    flex:
        1;

    height:
        1px;
}

.terms-heading::before {

    background:

        linear-gradient(
            90deg,
            transparent,
            #E19AB2
        );
}

.terms-heading::after {

    background:

        linear-gradient(
            90deg,
            #E19AB2,
            transparent
        );
}

.terms-heading span {

    color:
        var(--pink-dark);

    font-size:
        15px;

    font-weight:
        900;

    letter-spacing:
        .35px;

    text-transform:
        uppercase;
}

.terms-heading i {

    display:
        block;

    width:
        6px;

    height:
        6px;

    border-radius:
        50%;

    background:
        var(--pink);
}

/* =====================================================
   TERMS
   IMPORTANT: ONE CONTINUOUS FLOW
===================================================== */

.terms {

    column-count:
        2;

    column-gap:
        42px;

    column-rule:
        1px solid
        #E6D9DE;
}

.term {

    display:
        grid;

    grid-template-columns:
        29px
        minmax(0,1fr);

    gap:
        10px;

    margin:
        0
        0
        16px;

    break-inside:
        auto;

    page-break-inside:
        auto;
}

.term-number {

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    width:
        24px;

    height:
        24px;

    margin-top:
        1px;

    color:
        #83304D;

    border:
        1px solid
        #E9B5C7;

    border-radius:
        50%;

    background:

        linear-gradient(
            145deg,
            #F7D7E2,
            #FFEAF1
        );

    font-size:
        9.5px;

    font-weight:
        900;
}

.term-content {

    min-width:
        0;
}

.term-content h3 {

    margin:
        0
        0
        5px;

    color:
        #292226;

    font-size:
        10.5px;

    line-height:
        1.18;

    font-weight:
        900;

    text-transform:
        uppercase;
}

.term-content p {

    margin:
        0
        0
        5px;

    color:
        #373135;

    font-size:
        9px;

    line-height:
        1.38;

    widows:
        2;

    orphans:
        2;
}

.term-content p:last-child {
    margin-bottom: 0;
}

/* =====================================================
   APPROVAL + BANKID
===================================================== */

.signature-grid {

    display:
        grid;

    grid-template-columns:
        1fr
        1fr;

    gap:
        16px;

    margin-top:
        20px;
}

.approval-card,
.bankid-card {

    position:
        relative;

    min-height:
        170px;

    padding:
        17px
        18px;

    overflow:
        hidden;

    border-radius:
        12px;

    break-inside:
        avoid;

    page-break-inside:
        avoid;
}

.approval-card {

    border:
        1px solid
        var(--border);

    background:

        linear-gradient(
            145deg,
            #FFF8FA,
            #FFFFFF
        );
}

.approval-card::after {

    content:
        "J&W";

    position:
        absolute;

    right:
        -5px;

    bottom:
        -23px;

    color:
        rgba(
            190,
            68,
            109,
            .05
        );

    font-family:
        Georgia,
        serif;

    font-size:
        89px;

    font-weight:
        700;
}

.approval-title {

    position:
        relative;

    z-index:
        2;

    color:
        var(--pink-dark);

    font-size:
        13px;

    font-weight:
        900;

    text-transform:
        uppercase;
}

.approval-shield {

    position:
        relative;

    z-index:
        2;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    width:
        45px;

    height:
        48px;

    margin-top:
        14px;

    color:
        #FFFFFF;

    border-radius:
        14px
        14px
        19px
        19px;

    background:

        linear-gradient(
            180deg,
            #D36A90,
            #B6446C
        );

    box-shadow:
        0
        6px
        15px
        rgba(
            167,
            52,
            92,
            .13
        );

    font-size:
        23px;

    font-weight:
        900;
}

.approval-list {

    position:
        relative;

    z-index:
        2;

    margin-top:
        13px;
}

.approval-row {

    display:
        flex;

    gap:
        7px;

    margin-bottom:
        9px;

    color:
        var(--body);

    font-size:
        9.3px;

    line-height:
        1.35;
}

.approval-check {

    color:
        var(--pink);

    font-weight:
        900;
}

/* BANKID */

.bankid-card {

    border:
        1px solid
        var(--green-border);

    background:

        linear-gradient(
            145deg,
            var(--green-pale),
            #FFFFFF
        );
}

.bankid-card::after {

    content:
        "✓";

    position:
        absolute;

    right:
        -8px;

    bottom:
        -39px;

    color:
        rgba(
            50,
            113,
            95,
            .045
        );

    font-size:
        140px;

    font-weight:
        900;
}

.bankid-top {

    position:
        relative;

    z-index:
        2;

    display:
        flex;

    justify-content:
        space-between;

    align-items:
        flex-start;

    gap:
        13px;
}

.bankid-eyebrow {

    color:
        var(--green);

    font-size:
        9px;

    font-weight:
        900;

    text-transform:
        uppercase;
}

.bankid-title {

    margin-top:
        2px;

    color:
        var(--green-dark);

    font-size:
        16px;

    font-weight:
        900;
}

.bankid-logo-real {

    display:
        block;

    width:
        58px;

    max-height:
        48px;

    object-fit:
        contain;
}

.bankid-logo-fallback {

    min-width:
        58px;

    padding:
        8px
        9px;

    color:
        #FFFFFF;

    border-radius:
        7px;

    background:
        var(--bankid);

    text-align:
        center;

    font-size:
        11px;

    font-weight:
        900;
}

.bankid-data {

    position:
        relative;

    z-index:
        2;

    display:
        grid;

    grid-template-columns:
        112px
        minmax(0,1fr);

    gap:
        5px
        10px;

    margin-top:
        14px;

    font-size:
        8.8px;

    line-height:
        1.25;
}

.bankid-label {

    color:
        var(--muted);
}

.bankid-value {

    min-width:
        0;

    font-weight:
        800;

    overflow-wrap:
        anywhere;
}

.hash {

    font-family:
        Consolas,
        "Courier New",
        monospace;

    font-size:
        6.7px;
}

/* =====================================================
   SUMMARY
===================================================== */

.summary {

    position:
        relative;

    margin-top:
        15px;

    padding:
        14px
        15px;

    overflow:
        hidden;

    border:
        1px solid
        var(--border);

    border-radius:
        11px;

    background:

        linear-gradient(
            180deg,
            #FFFFFF,
            #FFF8FB
        );

    break-inside:
        avoid;

    page-break-inside:
        avoid;
}

.summary::before {

    content:
        "";

    position:
        absolute;

    left:
        -4%;

    right:
        -4%;

    top:
        5px;

    height:
        13px;

    border-top:
        3px solid
        rgba(
            222,
            118,
            153,
            .11
        );

    border-radius:
        50%;
}

.summary-title {

    position:
        relative;

    z-index:
        2;

    text-align:
        center;

    color:
        var(--pink-dark);

    font-size:
        10.5px;

    font-weight:
        900;

    text-transform:
        uppercase;
}

.summary-grid {

    position:
        relative;

    z-index:
        2;

    display:
        grid;

    grid-template-columns:
        repeat(6,1fr);

    margin-top:
        12px;
}

.summary-item {

    display:
        grid;

    grid-template-columns:
        32px
        minmax(0,1fr);

    gap:
        6px;

    align-items:
        center;

    padding:
        0
        8px;

    border-right:
        1px solid
        var(--border);
}

.summary-item:last-child {

    border-right:
        0;
}

.summary-circle {

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    width:
        29px;

    height:
        29px;

    color:
        var(--pink);

    border:
        1px solid
        #EABACB;

    border-radius:
        50%;

    background:
        #FFF5F8;

    font-size:
        12px;
}

.summary-item strong {

    display:
        block;

    color:
        #322B2F;

    font-size:
        8.3px;
}

.summary-item p {

    margin:
        2px
        0
        0;

    color:
        var(--body);

    font-size:
        7.4px;

    line-height:
        1.22;
}

/* =====================================================
   DOCUMENT INTEGRITY
===================================================== */

.integrity {

    display:
        grid;

    grid-template-columns:
        38px
        minmax(0,1fr);

    gap:
        11px;

    align-items:
        center;

    margin-top:
        12px;

    padding:
        11px
        17px;

    border:
        1px solid
        #EEE1E6;

    border-radius:
        10px;

    background:

        linear-gradient(
            180deg,
            #FFFDFE,
            #FFF9FB
        );

    break-inside:
        avoid;

    page-break-inside:
        avoid;
}

.integrity-icon {

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    width:
        33px;

    height:
        33px;

    color:
        #FFFFFF;

    border-radius:
        8px;

    background:

        linear-gradient(
            145deg,
            #D26A90,
            #B84870
        );

    font-size:
        15px;
}

.integrity-title {

    color:
        var(--pink-dark);

    font-size:
        9.5px;

    font-weight:
        900;

    text-transform:
        uppercase;
}

.integrity-text {

    margin-top:
        3px;

    color:
        var(--body);

    font-size:
        8.2px;

    line-height:
        1.35;
}

/* =====================================================
   FOOTER
===================================================== */

.contact-footer {

    position:
        relative;

    display:
        grid;

    grid-template-columns:
        repeat(3,1fr);

    gap:
        16px;

    padding:
        15px
        38px;

    color:
        #FFFFFF;

    background:

        linear-gradient(
            90deg,
            #B8446C,
            #D56A90,
            #C34F76
        );

    font-size:
        12px;

    font-weight:
        800;

    break-inside:
        avoid;

    page-break-inside:
        avoid;
}

.contact-item {

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    gap:
        8px;
}

.contact-icon {

    display:
        inline-flex;

    align-items:
        center;

    justify-content:
        center;

    width:
        25px;

    height:
        25px;

    border:
        1px solid
        rgba(
            255,
            255,
            255,
            .62
        );

    border-radius:
        50%;
}

/* footer bubbles */

.footer-bubble {

    position:
        absolute;

    border:
        2px solid
        rgba(
            255,
            255,
            255,
            .45
        );

    border-radius:
        50%;
}

.fbubble1 {

    width:
        19px;

    height:
        19px;

    right:
        55px;

    top:
        -12px;
}

.fbubble2 {

    width:
        11px;

    height:
        11px;

    right:
        84px;

    top:
        -3px;
}

/* =====================================================
   DESKTOP
===================================================== */

@media screen and (min-width: 1100px) {

    .info-card,
    .kpi,
    .approval-card,
    .bankid-card {

        transition:
            transform .18s ease,
            box-shadow .18s ease;
    }

    .info-card:hover,
    .kpi:hover {

        transform:
            translateY(-2px);
    }
}

/* =====================================================
   TABLET
===================================================== */

@media screen and (max-width: 1050px) {

    body {

        padding:
            18px
            10px;
    }

    .hero {

        padding:
            23px
            25px
            49px;
    }

    .hero-grid {

        grid-template-columns:
            minmax(0,1fr)
            270px;

        gap:
            22px;
    }

    .brand-logo {

        max-width:
            420px;

        height:
            70px;
    }

    .content {

        padding:
            19px
            25px
            26px;
    }

    .info-row {

        grid-template-columns:
            118px
            minmax(0,1fr);
    }

    .kpi {

        grid-template-columns:
            43px
            minmax(0,1fr);

        padding:
            14px
            10px;
    }

    .kpi-icon {

        width:
            40px;

        height:
            40px;
    }

    .summary-grid {

        grid-template-columns:
            repeat(3,1fr);

        row-gap:
            12px;
    }

    .summary-item:nth-child(3) {

        border-right:
            0;
    }
}

/* =====================================================
   MOBILE
===================================================== */

@media screen and (max-width: 720px) {

    html,
    body {

        background:
            #FFFFFF;
    }

    body {
        padding: 0;
    }

    .contract {

        width:
            100%;

        border:
            0;

        border-radius:
            0;

        box-shadow:
            none;
    }

    .hero {

        padding:
            19px
            14px
            41px;
    }

    .hero-grid {

        grid-template-columns:
            1fr;

        gap:
            18px;
    }

    .brand-logo {

        height:
            auto;

        max-height:
            72px;

        max-width:
            100%;
    }

    .fallback-wordmark {

        font-size:
            27px;
    }

    .avtal-heading strong {

        font-size:
            20px;
    }

    .avtal-row {

        grid-template-columns:
            113px
            minmax(0,1fr);

        font-size:
            12.5px;
    }

    .content {

        padding:
            16px
            13px
            20px;
    }

    .info-grid {

        grid-template-columns:
            1fr;

        gap:
            12px;
    }

    .info-row {

        grid-template-columns:
            112px
            minmax(0,1fr);

        font-size:
            13px;
    }

    .kpi-grid {

        grid-template-columns:
            1fr
            1fr;
    }

    .kpi {

        grid-template-columns:
            40px
            minmax(0,1fr);

        padding:
            12px
            8px;
    }

    .kpi:nth-child(3) {

        border-left:
            0;

        border-top:
            1px solid
            var(--border);
    }

    .kpi:nth-child(4) {

        border-top:
            1px solid
            var(--border);
    }

    .kpi-icon {

        width:
            38px;

        height:
            38px;
    }

    .kpi-value {

        font-size:
            14px;
    }

    .terms-heading span {

        font-size:
            12px;
    }

    .terms {

        column-count:
            1;

        column-rule:
            0;
    }

    .term {

        grid-template-columns:
            31px
            minmax(0,1fr);

        gap:
            10px;

        margin-bottom:
            19px;
    }

    .term-number {

        width:
            28px;

        height:
            28px;

        font-size:
            10px;
    }

    .term-content h3 {

        font-size:
            13px;
    }

    .term-content p {

        font-size:
            13px;

        line-height:
            1.55;
    }

    .signature-grid {

        grid-template-columns:
            1fr;

        gap:
            12px;
    }

    .approval-card,
    .bankid-card {

        min-height:
            auto;
    }

    .bankid-data {

        grid-template-columns:
            108px
            minmax(0,1fr);

        font-size:
            11px;
    }

    .hash {

        font-size:
            8px;
    }

    .summary-grid {

        grid-template-columns:
            1fr;
    }

    .summary-item {

        padding:
            8px
            0;

        border-right:
            0;

        border-bottom:
            1px solid
            var(--border);
    }

    .summary-item:last-child {

        border-bottom:
            0;
    }

    .summary-item strong {

        font-size:
            11px;
    }

    .summary-item p {

        font-size:
            10px;
    }

    .contact-footer {

        grid-template-columns:
            1fr;

        gap:
            8px;

        padding:
            14px
            16px;

        font-size:
            12px;
    }

    .contact-item {

        justify-content:
            flex-start;
    }
}

/* =====================================================
   PRINT / PDF
   NO MANUAL PAGE SECTIONS
===================================================== */

@page {

    size:
        A4;

    margin:
        9mm
        9mm
        10mm;
}

@media print {

    html,
    body {

        margin:
            0;

        padding:
            0;

        background:
            #FFFFFF;
    }

    body {

        color:
            #202020;

        font-size:
            8pt;
    }

    .contract {

        width:
            auto;

        margin:
            0;

        overflow:
            visible;

        border:
            0;

        border-radius:
            0;

        box-shadow:
            none;
    }

    /* HEADER */

    .hero {

        padding:
            0
            0
            9mm;

        overflow:
            visible;

        break-after:
            avoid;

        page-break-after:
            avoid;
    }

    .hero-grid {

        grid-template-columns:
            minmax(0,1fr)
            58mm;

        gap:
            5mm;
    }

    .brand-logo {

        width:
            auto;

        max-width:
            110mm;

        height:
            18mm;
    }

    .fallback-wordmark {

        font-size:
            22pt;
    }

    .avtal-card {

        border-radius:
            2.5mm;
    }

    .avtal-heading {

        padding:
            2mm
            3mm;
    }

    .avtal-heading strong {

        font-size:
            12pt;
    }

    .avtal-heading span {

        margin-top:
            .6mm;

        font-size:
            6pt;
    }

    .avtal-body {

        padding:
            2.3mm
            3mm;
    }

    .avtal-row {

        grid-template-columns:
            23mm
            minmax(0,1fr);

        gap:
            1mm;

        margin-bottom:
            .7mm;

        font-size:
            6.4pt;
    }

    .hero-waves {

        left:
            -9mm;

        right:
            -9mm;

        bottom:
            0;

        height:
            9mm;
    }

    .wave-a {

        height:
            8mm;

        border-bottom-width:
            2.2mm;
    }

    .wave-b {

        height:
            7mm;

        border-bottom-width:
            1mm;
    }

    .hero-bubbles {

        transform:
            scale(.6);

        transform-origin:
            center bottom;
    }

    /* CONTENT */

    .content {

        padding:
            4mm
            0
            0;
    }

    /* INFO */

    .info-grid {

        gap:
            3mm;

        break-inside:
            avoid;

        page-break-inside:
            avoid;
    }

    .info-card {

        border-radius:
            2.4mm;
    }

    .info-heading {

        gap:
            1.5mm;

        padding:
            1.8mm
            2.6mm;

        font-size:
            7pt;
    }

    .info-icon {

        width:
            5mm;

        height:
            5mm;

        font-size:
            7pt;
    }

    .info-body {

        padding:
            2.3mm
            2.8mm;
    }

    .info-row {

        grid-template-columns:
            28mm
            minmax(0,1fr);

        gap:
            1.3mm;

        margin-bottom:
            .7mm;

        font-size:
            6.4pt;
    }

    /* KPI */

    .kpi-grid {

        margin-top:
            3mm;

        border-radius:
            2.4mm;

        break-inside:
            avoid;

        page-break-inside:
            avoid;
    }

    .kpi {

        grid-template-columns:
            10.5mm
            minmax(0,1fr);

        gap:
            1.4mm;

        padding:
            2.2mm
            1.8mm;
    }

    .kpi-icon {

        width:
            9.5mm;

        height:
            9.5mm;

        font-size:
            12pt;
    }

    .kpi-value {

        font-size:
            8.3pt;
    }

    .kpi-label {

        margin-top:
            .4mm;

        font-size:
            5pt;
    }

    .kpi-description {

        margin-top:
            .6mm;

        font-size:
            5.1pt;

        line-height:
            1.18;
    }

    /* TERMS TITLE */

    .terms-heading {

        margin:
            4mm
            0
            2.7mm;
    }

    .terms-heading span {

        font-size:
            8pt;
    }

    .terms-heading i {

        width:
            1.5mm;

        height:
            1.5mm;
    }

    /* TERMS */

    .terms {

        column-count:
            2;

        column-gap:
            8mm;

        column-rule:
            .25mm solid
            #E2D5DA;

        column-fill:
            auto;
    }

    .term {

        grid-template-columns:
            5.5mm
            minmax(0,1fr);

        gap:
            1.5mm;

        margin-bottom:
            2.2mm;

        break-inside:
            auto;

        page-break-inside:
            auto;
    }

    .term-number {

        width:
            5mm;

        height:
            5mm;

        font-size:
            5.4pt;
    }

    .term-content h3 {

        margin-bottom:
            .75mm;

        font-size:
            6.7pt;

        line-height:
            1.12;

        break-after:
            avoid;

        page-break-after:
            avoid;
    }

    .term-content p {

        margin-bottom:
            .7mm;

        font-size:
            5.85pt;

        line-height:
            1.3;

        widows:
            3;

        orphans:
            3;
    }

    /* SIGNATURE */

    .signature-grid {

        gap:
            3mm;

        margin-top:
            3.8mm;

        break-inside:
            avoid;

        page-break-inside:
            avoid;
    }

    .approval-card,
    .bankid-card {

        min-height:
            39mm;

        padding:
            3mm;

        border-radius:
            2.4mm;
    }

    .approval-title {

        font-size:
            7pt;
    }

    .approval-shield {

        width:
            8.5mm;

        height:
            9.5mm;

        margin-top:
            2mm;

        font-size:
            12pt;
    }

    .approval-list {

        margin-top:
            2.1mm;
    }

    .approval-row {

        gap:
            1.3mm;

        margin-bottom:
            1.4mm;

        font-size:
            5.5pt;

        line-height:
            1.25;
    }

    .bankid-eyebrow {

        font-size:
            5.2pt;
    }

    .bankid-title {

        margin-top:
            .3mm;

        font-size:
            8.5pt;
    }

    .bankid-logo-real {

        width:
            14mm;

        max-height:
            11mm;
    }

    .bankid-logo-fallback {

        min-width:
            14mm;

        padding:
            1.6mm
            2mm;

        border-radius:
            1.5mm;

        font-size:
            6.5pt;
    }

    .bankid-data {

        grid-template-columns:
            24mm
            minmax(0,1fr);

        gap:
            .8mm
            1.4mm;

        margin-top:
            2.1mm;

        font-size:
            5.3pt;
    }

    .hash {

        font-size:
            4.2pt;
    }

    /* SUMMARY */

    .summary {

        margin-top:
            2.8mm;

        padding:
            2.6mm
            2.8mm;

        border-radius:
            2.3mm;

        break-inside:
            avoid;
    }

    .summary-title {

        font-size:
            6.5pt;
    }

    .summary-grid {

        margin-top:
            2mm;
    }

    .summary-item {

        grid-template-columns:
            6.5mm
            minmax(0,1fr);

        gap:
            .9mm;

        padding:
            0
            1.3mm;
    }

    .summary-circle {

        width:
            6mm;

        height:
            6mm;

        font-size:
            6.5pt;
    }

    .summary-item strong {

        font-size:
            5pt;
    }

    .summary-item p {

        margin-top:
            .3mm;

        font-size:
            4.7pt;

        line-height:
            1.15;
    }

    /* INTEGRITY */

    .integrity {

        grid-template-columns:
            7.5mm
            minmax(0,1fr);

        gap:
            1.7mm;

        margin-top:
            2.1mm;

        padding:
            2mm
            2.7mm;

        border-radius:
            2mm;

        break-inside:
            avoid;
    }

    .integrity-icon {

        width:
            6.5mm;

        height:
            6.5mm;

        border-radius:
            1.4mm;

        font-size:
            8pt;
    }

    .integrity-title {

        font-size:
            5.7pt;
    }

    .integrity-text {

        margin-top:
            .5mm;

        font-size:
            5pt;

        line-height:
            1.25;
    }

    /* FOOTER */

    .contact-footer {

        grid-template-columns:
            repeat(3,1fr);

        gap:
            3mm;

        margin:
            2.8mm
            -9mm
            -10mm;

        padding:
            2.8mm
            9mm;

        font-size:
            6pt;

        break-inside:
            avoid;
    }

    .contact-icon {

        width:
            5mm;

        height:
            5mm;

        font-size:
            6pt;
    }
}

</style>

</head>

<body>

<div class="contract">

    <!-- =================================================
         HEADER
    ================================================== -->

    <header class="hero">

        <div class="hero-grid">

            <div>
                ${brandLogo()}
            </div>

            <section class="avtal-card">

                <div class="avtal-heading">

                    <strong>
                        AVTAL
                    </strong>

                    <span>
                        Återkommande hemstädning
                    </span>

                </div>

                <div class="avtal-body">

                    <div class="avtal-row">

                        <span>
                            Avtalsnummer:
                        </span>

                        <strong>
                            ${escapeHtml(contractNumber)}
                        </strong>

                    </div>

                    <div class="avtal-row">

                        <span>
                            Datum:
                        </span>

                        <strong>
                            ${escapeHtml(signedDate)}
                        </strong>

                    </div>

                    <div class="avtal-row">

                        <span>
                            Status:
                        </span>

                        <span class="status">
                            SIGNERAT
                        </span>

                    </div>

                </div>

            </section>

        </div>

        <div class="hero-bubbles">

            <span class="hero-bubble hb1"></span>
            <span class="hero-bubble hb2"></span>
            <span class="hero-bubble hb3"></span>

        </div>

        <div class="hero-waves">

            <div class="wave wave-a"></div>

            <div class="wave wave-b"></div>

        </div>

    </header>

    <!-- =================================================
         CONTENT
    ================================================== -->

    <main class="content">

        <!-- =============================================
             CUSTOMER + SERVICE
        ============================================== -->

        <section class="info-grid">

            <article class="info-card">

                <div class="info-heading">

                    <span class="info-icon">
                        ●
                    </span>

                    KUNDUPPGIFTER

                </div>

                <div class="info-body">

                    ${infoRow(
                        "Namn:",
                        customerName
                    )}

                    ${infoRow(
                        "Personnummer:",
                        customerPersonnummer
                    )}

                    ${infoRow(
                        "Telefon:",
                        customerPhone
                    )}

                    ${infoRow(
                        "E-post:",
                        customerEmail
                    )}

                    ${infoRow(
                        "Adress:",
                        customerStreet
                    )}

                    ${infoRow(
                        "Postnummer:",
                        customerPostal
                    )}

                    ${infoRow(
                        "Ort:",
                        customerCity
                    )}

                </div>

            </article>

            <article class="info-card">

                <div class="info-heading">

                    <span class="info-icon">
                        ⌂
                    </span>

                    STÄDTJÄNST

                </div>

                <div class="info-body">

                    ${infoRow(
                        "Tjänst:",
                        "Återkommande hemstädning"
                    )}

                    ${infoRow(
                        "Städadress:",
                        serviceAddress
                    )}

                    ${infoRow(
                        "Bostadens storlek:",
                        `${area} m²`
                    )}

                    ${infoRow(
                        "Frekvens:",
                        frequency
                    )}

                    ${infoRow(
                        "Beräknad städtid:",
                        `${estimatedHours} timmar`
                    )}

                    ${infoRow(
                        "Veckodag:",
                        weekday
                    )}

                    ${infoRow(
                        "Starttid:",
                        startTime
                    )}

                    ${infoRow(
                        "Startdatum:",
                        startDate
                    )}

                </div>

            </article>

        </section>

        <!-- =============================================
             KPI
        ============================================== -->

        <section class="kpi-grid">

            <article class="kpi">

                <div class="kpi-icon">
                    ◎
                </div>

                <div>

                    <div class="kpi-value">
                        ${escapeHtml(introPrice)} kr/timme
                    </div>

                    <div class="kpi-label">
                        INTRODUKTIONSPRIS
                    </div>

                    <div class="kpi-description">
                        Efter preliminärt RUT-avdrag.
                        För de första 3 ordinarie
                        städtillfällena.
                    </div>

                </div>

            </article>

            <article class="kpi">

                <div class="kpi-icon">
                    ◆
                </div>

                <div>

                    <div class="kpi-value">
                        ${escapeHtml(regularPrice)} kr/timme
                    </div>

                    <div class="kpi-label">
                        ORDINARIE PRIS
                    </div>

                    <div class="kpi-description">
                        Efter preliminärt RUT-avdrag.
                        Från och med städtillfälle 4.
                    </div>

                </div>

            </article>

            <article class="kpi">

                <div class="kpi-icon">
                    ▦
                </div>

                <div>

                    <div class="kpi-value">
                        12 månader
                    </div>

                    <div class="kpi-label">
                        BINDNINGSTID
                    </div>

                    <div class="kpi-description">
                        Avtalet gäller i 12 månader
                        från avtalets startdatum.
                    </div>

                </div>

            </article>

            <article class="kpi">

                <div class="kpi-icon">
                    ◷
                </div>

                <div>

                    <div class="kpi-value">
                        24 timmar
                    </div>

                    <div class="kpi-label">
                        OMBOKNING
                    </div>

                    <div class="kpi-description">
                        Kostnadsfritt före planerad
                        starttid.
                    </div>

                </div>

            </article>

        </section>

        <!-- =============================================
             TERMS HEADER
        ============================================== -->

        <div class="terms-heading">

            <i></i>

            <span>
                AVTALSVILLKOR
            </span>

            <i></i>

        </div>

        <!-- =============================================
             ALL 18 TERMS - ONE FLOW
        ============================================== -->

        <section class="terms">

            ${term(
                1,
                "Pris och introduktionserbjudande",
                [
                    `Kunden har accepterat ett introduktionserbjudande från J&W Quality Hemservice.`,
                    `För Kundens första tre (3) ordinarie städtillfällen gäller ett pris om ${escapeHtml(introPrice)} kronor per timme efter preliminärt RUT-avdrag.`,
                    `Från och med Kundens fjärde ordinarie städtillfälle gäller det ordinarie priset ${escapeHtml(regularPrice)} kronor per timme efter preliminärt RUT-avdrag.`,
                    `Introduktionspriset innebär inte att avtalet avslutas efter de tre första städtillfällena.`
                ]
            )}

            ${term(
                2,
                "RUT-avdrag",
                [
                    `Priser efter RUT-avdrag förutsätter att Kunden uppfyller Skatteverkets villkor för skattereduktionen.`,
                    `Kunden ansvarar för att lämnade personuppgifter är korrekta och att Kunden har tillräckligt skatteutrymme.`,
                    `Om Skatteverket helt eller delvis avslår RUT-avdraget har J&W Quality Hemservice rätt att fakturera Kunden motsvarande återstående belopp.`
                ]
            )}

            ${term(
                3,
                "Bindningstid",
                [
                    `Avtalet har en inledande bindningstid om tolv (12) månader från avtalets startdatum.`,
                    `Kunden bekräftar att introduktionserbjudandet är kopplat till detta avtal om återkommande hemstädning.`,
                    `Kundens rättigheter enligt tvingande svensk konsumentlagstiftning påverkas inte.`
                ]
            )}

            ${term(
                4,
                "Efter bindningstidens slut",
                [
                    `Efter de första 12 månaderna övergår avtalet till ett tillsvidareavtal med 30 dagars uppsägningstid.`
                ]
            )}

            ${term(
                5,
                "Ombokning och avbokning",
                [
                    `Kunden kan kostnadsfritt begära ombokning eller avbokning om J&W Quality Hemservice meddelas senast 24 timmar före bokad starttid.`,
                    `Vid sjukdom eller annan oförutsedd händelse ska Kunden kontakta J&W Quality Hemservice så snart som möjligt.`
                ]
            )}

            ${term(
                6,
                "Sen avbokning",
                [
                    `Vid avbokning senare än 24 timmar före bokad starttid kan J&W Quality Hemservice ta ut skälig ersättning i den omfattning som följer av avtalet och tillämplig svensk lag.`,
                    `Avbokning av ett enskilt städtillfälle innebär inte att huvudavtalet automatiskt avslutas.`
                ]
            )}

            ${term(
                7,
                "Tillträde till bostaden",
                [
                    `Kunden ansvarar för att J&W Quality Hemservice får tillträde till bostaden vid överenskommen tid.`,
                    `Om tillträde inte kan ske på grund av exempelvis felaktig portkod, saknad nyckel, låst dörr eller aktiverat larm kan detta behandlas enligt reglerna för sen avbokning.`
                ]
            )}

            ${term(
                8,
                "Städutrustning och material",
                [
                    `Om inget annat särskilt har avtalats använder J&W Quality Hemservice Kundens städutrustning och städmaterial.`,
                    `Kunden ansvarar för att lämplig och fungerande utrustning finns tillgänglig.`
                ]
            )}

            ${term(
                9,
                "Personal och arbetsmiljö",
                [
                    `J&W Quality Hemservice bestämmer vilken lämplig personal som utför tjänsten och kan vid behov ersätta ordinarie personal.`,
                    `Kunden ansvarar för att bostaden erbjuder en rimligt säker arbetsmiljö och ska informera om husdjur eller andra omständigheter som påverkar arbetet.`
                ]
            )}

            ${term(
                10,
                "Utförande och reklamation",
                [
                    `J&W Quality Hemservice ska utföra tjänsten professionellt och omsorgsfullt enligt vad som har avtalats.`,
                    `Om Kunden anser att tjänsten är bristfällig ska J&W Quality Hemservice kontaktas så snart som möjligt och ges skälig möjlighet att undersöka och vid behov åtgärda konstaterade brister.`
                ]
            )}

            ${term(
                11,
                "Skador och ansvar",
                [
                    `Skador som Kunden anser har uppstått i samband med städningen ska meddelas J&W Quality Hemservice så snart som möjligt.`,
                    `J&W Quality Hemservice ansvarar för skador i den omfattning som följer av svensk lag och ska ha relevant ansvarsförsäkring för verksamheten.`
                ]
            )}

            ${term(
                12,
                "Fakturering och betalning",
                [
                    `Fakturering sker normalt månadsvis om inget annat har avtalats.`,
                    `Vid försenad betalning kan J&W Quality Hemservice ta ut dröjsmålsränta och tillåtna påminnelse- och inkassoavgifter enligt gällande regler.`
                ]
            )}

            ${term(
                13,
                "Prisändring",
                [
                    `Under den inledande bindningstiden gäller den prisstruktur som Kunden har accepterat.`,
                    `Efter bindningstidens slut får J&W Quality Hemservice ändra ordinarie pris efter att Kunden informerats i skälig tid.`
                ]
            )}

            ${term(
                14,
                "Ångerrätt vid distansavtal",
                [
                    `Om avtalet ingås på distans har Kunden som huvudregel 14 dagars ångerrätt enligt svensk lag.`,
                    `Den lagstadgade ångerrätten gäller oberoende av avtalets bindningstid.`
                ]
            )}

            ${term(
                15,
                "Personuppgifter och sekretess",
                [
                    `J&W Quality Hemservice behandlar Kundens personuppgifter för administration av avtalet, planering, fakturering, RUT-avdrag, kommunikation, elektronisk signering och rättsliga skyldigheter.`,
                    `Uppgifter om bostad, nycklar och koder ska hanteras med lämplig sekretess.`
                ]
            )}

            ${term(
                16,
                "Elektronisk kommunikation",
                [
                    `Kunden accepterar att avtalsrelaterad information, påminnelser, fakturor och signerade dokument kan skickas via e-post och/eller SMS.`
                ]
            )}

            ${term(
                17,
                "Elektronisk signering med BankID",
                [
                    `Innan signeringen ska Kunden ha möjlighet att läsa hela detta avtal.`,
                    `Genom BankID-signeringen bekräftar Kunden sin identitet och att Kunden har tagit del av och accepterat avtalsvillkoren.`,
                    `Efter signeringen ska Kunden få en kopia av det signerade avtalet på ett varaktigt medium, exempelvis PDF via e-post.`
                ]
            )}

            ${term(
                18,
                "Tillämplig lag och tvist",
                [
                    `Svensk lag gäller för avtalet.`,
                    `Parterna ska i första hand försöka lösa en eventuell tvist genom dialog.`,
                    `Kunden kan, när förutsättningarna är uppfyllda, få en konsumenttvist prövad av Allmänna reklamationsnämnden (ARN).`
                ]
            )}

        </section>

        <!-- =============================================
             APPROVAL + BANKID
        ============================================== -->

        <section class="signature-grid">

            <article class="approval-card">

                <div class="approval-title">
                    J&W QUALITY HEMSERVICES GODKÄNNANDE
                </div>

                <div class="approval-shield">
                    ✓
                </div>

                <div class="approval-list">

                    <div class="approval-row">

                        <span class="approval-check">
                            ✓
                        </span>

                        <span>
                            Detta avtal är utfärdat och digitalt
                            förhandsgodkänt av J&W Quality Hemservice.
                        </span>

                    </div>

                    <div class="approval-row">

                        <span class="approval-check">
                            ✓
                        </span>

                        <span>
                            Kundens identitet och avtalsaccept
                            verifieras genom den elektroniska
                            BankID-signeringen.
                        </span>

                    </div>

                    <div class="approval-row">

                        <span class="approval-check">
                            ✓
                        </span>

                        <span>
                            Detta dokument är juridiskt bindande.
                        </span>

                    </div>

                    <div class="approval-row">

                        <strong>
                            J&W Quality Hemservice
                        </strong>

                    </div>

                </div>

            </article>

            <article class="bankid-card">

                <div class="bankid-top">

                    <div>

                        <div class="bankid-eyebrow">
                            ELEKTRONISK SIGNERING
                        </div>

                        <div class="bankid-title">
                            Verifierad med BankID
                        </div>

                    </div>

                    ${
                        bankIdLogo
                        ?
                        `
                            <img
                                class="bankid-logo-real"
                                src="${bankIdLogo}"
                                alt="BankID"
                            >
                        `
                        :
                        `
                            <div class="bankid-logo-fallback">
                                BankID
                            </div>
                        `
                    }

                </div>

                <div class="bankid-data">

                    <span class="bankid-label">
                        Avtalsnummer:
                    </span>

                    <span class="bankid-value">
                        ${escapeHtml(contractNumber)}
                    </span>

                    <span class="bankid-label">
                        Signeringsmetod:
                    </span>

                    <span class="bankid-value">
                        BankID
                    </span>

                    <span class="bankid-label">
                        Signerad av:
                    </span>

                    <span class="bankid-value">
                        ${escapeHtml(signedName)}
                    </span>

                    <span class="bankid-label">
                        Personnummer:
                    </span>

                    <span class="bankid-value">
                        ${escapeHtml(
                            maskPersonnummer(
                                signedPersonnummer
                            )
                        )}
                    </span>

                    <span class="bankid-label">
                        Signeringstid:
                    </span>

                    <span class="bankid-value">
                        ${escapeHtml(signedDateTime)}
                    </span>

                    <span class="bankid-label">
                        Avtalsversion:
                    </span>

                    <span class="bankid-value">
                        ${escapeHtml(version)}
                    </span>

                    <span class="bankid-label">
                        Avtalshash:
                    </span>

                    <span class="bankid-value hash">
                        ${escapeHtml(contractHash)}
                    </span>

                </div>

            </article>

        </section>

        <!-- =============================================
             SUMMARY
        ============================================== -->

        <section class="summary">

            <div class="summary-title">
                SAMMANFATTNING AV NYCKELVILLKOR
            </div>

            <div class="summary-grid">

                ${summaryItem(
                    "◎",
                    "Introduktionspris:",
                    `${escapeHtml(introPrice)} kr/timme efter RUT första 3 städtillfällena`
                )}

                ${summaryItem(
                    "◆",
                    "Ordinarie pris:",
                    `${escapeHtml(regularPrice)} kr/timme efter RUT från städtillfälle 4`
                )}

                ${summaryItem(
                    "▦",
                    "Bindningstid:",
                    "12 månader från avtalets startdatum"
                )}

                ${summaryItem(
                    "◷",
                    "Ombokning:",
                    "senast 24 timmar innan planerad städtid"
                )}

                ${summaryItem(
                    "▣",
                    "Uppsägning:",
                    "30 dagar efter bindningstidens slut"
                )}

                ${summaryItem(
                    "▤",
                    "Betalning:",
                    "månadsvis i efterhand"
                )}

            </div>

        </section>

        <!-- =============================================
             DOCUMENT INTEGRITY
        ============================================== -->

        <section class="integrity">

            <div class="integrity-icon">
                ▣
            </div>

            <div>

                <div class="integrity-title">
                    DOKUMENTINTEGRITET
                </div>

                <div class="integrity-text">

                    BankID-signaturen och OCSP-svaret sparas säkert
                    i J&W Quality Hemservices system som tekniskt
                    signeringsbevis.

                    Den signerade PDF-filen får dessutom ett
                    SHA-256-hashvärde när dokumentet genereras.

                </div>

            </div>

        </section>

    </main>

    <!-- =============================================
         CONTACT FOOTER
    ============================================== -->

    <footer class="contact-footer">

        <span class="footer-bubble fbubble1"></span>
        <span class="footer-bubble fbubble2"></span>

        <div class="contact-item">

            <span class="contact-icon">
                ☎
            </span>

            <span>
                +46 700 433 157
            </span>

        </div>

        <div class="contact-item">

            <span class="contact-icon">
                ✉
            </span>

            <span>
                jw.qualityhemservice@gmail.com
            </span>

        </div>

        <div class="contact-item">

            <span class="contact-icon">
                ◎
            </span>

            <span>
                www.jwquality.se
            </span>

        </div>

    </footer>

</div>

</body>

</html>
    `;
}

module.exports = {
    buildSignedContractTemplate
};
