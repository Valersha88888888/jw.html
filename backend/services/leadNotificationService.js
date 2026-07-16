const twilio = require("twilio");
const transporter = require("../config/mailConfig");

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function displayValue(value, fallback = "Ej angivet") {
    const text = String(value ?? "").trim();
    return text || fallback;
}

function normalizeSwedishPhone(phone) {
    if (!phone) {
        return null;
    }

    let normalized = String(phone)
        .trim()
        .replace(/[^\d+]/g, "");

    if (normalized.startsWith("00")) {
        normalized = `+${normalized.slice(2)}`;
    }

    if (normalized.startsWith("0")) {
        normalized = `+46${normalized.slice(1)}`;
    }

    if (!normalized.startsWith("+")) {
        normalized = `+${normalized}`;
    }

    return /^\+\d{8,15}$/.test(normalized)
        ? normalized
        : null;
}

function getTwilioClient() {
    const {
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_MESSAGING_SERVICE_SID
    } = process.env;

    if (
        !TWILIO_ACCOUNT_SID ||
        !TWILIO_AUTH_TOKEN ||
        !TWILIO_MESSAGING_SERVICE_SID
    ) {
        return null;
    }

    return twilio(
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN
    );
}

async function sendSms(to, body) {
    const client = getTwilioClient();

    if (!client) {
        return {
            skipped: true,
            reason: "Twilio is not configured"
        };
    }

    const normalizedPhone = normalizeSwedishPhone(to);

    if (!normalizedPhone) {
        return {
            skipped: true,
            reason: "Invalid or missing phone number"
        };
    }

    const message = await client.messages.create({
        messagingServiceSid:
            process.env.TWILIO_MESSAGING_SERVICE_SID,
        to: normalizedPhone,
        body
    });

    return {
        skipped: false,
        sid: message.sid,
        status: message.status,
        to: normalizedPhone
    };
}

async function sendLeadCustomerEmail(lead) {
    if (!lead.email) {
        return {
            skipped: true,
            reason: "Customer email is missing"
        };
    }

    const customerName = escapeHtml(
        displayValue(lead.name, "kund")
    );

    const service = escapeHtml(
        displayValue(lead.serviceType)
    );

    const area = escapeHtml(
        displayValue(lead.area)
    );

    const companyPhone = escapeHtml(
        process.env.COMPANY_PHONE || "076-909 02 40"
    );

    const companyEmail = escapeHtml(
        process.env.EMAIL_USER || ""
    );

    const info = await transporter.sendMail({
        from:
            `"J&W Quality Hemservice" <${process.env.EMAIL_USER}>`,

        to: lead.email,

        subject:
            "Tack för din offertförfrågan – J&W Quality Hemservice",

        html: `
<!doctype html>
<html lang="sv">
<body style="margin:0;background:#f7f3f7;font-family:Arial,sans-serif;color:#2f2f2f;">
    <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
        <div style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.08);">

            <div style="background:linear-gradient(135deg,#d97ac6,#b45ca5);padding:30px;color:#ffffff;">
                <h1 style="margin:0;font-size:28px;">
                    Tack för din förfrågan
                </h1>

                <p style="margin:10px 0 0;font-size:16px;">
                    J&W Quality Hemservice
                </p>
            </div>

            <div style="padding:32px;">
                <p style="font-size:18px;margin-top:0;">
                    Hej ${customerName}!
                </p>

                <p style="line-height:1.7;">
                    Tack för att du har valt att kontakta
                    <strong>J&W Quality Hemservice</strong>.
                    Vi är mycket glada över ditt intresse och
                    uppskattar förtroendet att få hjälpa dig
                    med en lösning anpassad efter dina behov.
                </p>

                <p style="line-height:1.7;">
                    Din offertförfrågan har tagits emot och
                    registrerats i vårt system. En av våra
                    medarbetare kommer nu att gå igenom
                    informationen och kontakta dig så snart
                    som möjligt, vanligtvis inom
                    <strong>24 timmar på vardagar</strong>.
                </p>

                <div style="background:#faf4fa;border-left:4px solid #d97ac6;padding:18px;margin:24px 0;border-radius:8px;">
                    <p style="margin:0 0 8px;">
                        <strong>Tjänst:</strong> ${service}
                    </p>

                    <p style="margin:0;">
                        <strong>Område:</strong> ${area}
                    </p>
                </div>

                <p style="line-height:1.7;">
                    Vårt mål är att erbjuda professionell
                    service, hög kvalitet och en trygg
                    kundupplevelse från första kontakten
                    till slutfört arbete.
                </p>

                <p style="line-height:1.7;">
                    Du är alltid varmt välkommen att kontakta
                    oss om du vill komplettera din förfrågan
                    eller har några frågor under tiden.
                </p>

                <div style="margin:28px 0;">
                    <p style="margin:7px 0;">✓ Personlig service</p>
                    <p style="margin:7px 0;">✓ Professionellt utfört arbete</p>
                    <p style="margin:7px 0;">✓ Flexibla lösningar efter dina behov</p>
                    <p style="margin:7px 0;">✓ Trygg och pålitlig hemservice</p>
                </div>

                <p style="line-height:1.7;">
                    Tack för ditt förtroende. Vi ser fram emot
                    att få hjälpa dig!
                </p>

                <p style="margin-bottom:0;">
                    Med vänliga hälsningar<br>
                    <strong>J&W Quality Hemservice</strong><br><br>
                    Telefon: ${companyPhone}<br>
                    E-post: ${companyEmail}
                </p>
            </div>
        </div>
    </div>
</body>
</html>
        `
    });

    return {
        skipped: false,
        messageId: info.messageId
    };
}

async function sendLeadManagerEmail(lead) {
    const managerEmail =
        process.env.LEAD_NOTIFICATION_EMAIL ||
        process.env.EMAIL_USER;

    if (!managerEmail) {
        return {
            skipped: true,
            reason: "Manager notification email is missing"
        };
    }

    const createdAt = lead.createdAt
        ? new Date(lead.createdAt).toLocaleString("sv-SE")
        : new Date().toLocaleString("sv-SE");

    const info = await transporter.sendMail({
        from:
            `"J&W CRM" <${process.env.EMAIL_USER}>`,

        to: managerEmail,

        subject:
            `Ny offertförfrågan: ${displayValue(lead.name, "Okänd kund")}`,

        html: `
<!doctype html>
<html lang="sv">
<body style="font-family:Arial,sans-serif;color:#292929;background:#f5f5f5;padding:24px;">
    <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:14px;padding:28px;box-shadow:0 6px 24px rgba(0,0,0,.08);">

        <h1 style="color:#b45ca5;margin-top:0;">
            Ny offertförfrågan
        </h1>

        <p>
            En ny kundförfrågan har registrerats i J&W CRM.
        </p>

        <table style="width:100%;border-collapse:collapse;margin-top:22px;">
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;"><strong>CRM-ID</strong></td>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;">${escapeHtml(displayValue(lead.id))}</td>
            </tr>
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;"><strong>Namn</strong></td>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;">${escapeHtml(displayValue(lead.name))}</td>
            </tr>
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;"><strong>Telefon</strong></td>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;">${escapeHtml(displayValue(lead.phone))}</td>
            </tr>
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;"><strong>E-post</strong></td>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;">${escapeHtml(displayValue(lead.email))}</td>
            </tr>
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;"><strong>Tjänst</strong></td>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;">${escapeHtml(displayValue(lead.serviceType))}</td>
            </tr>
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;"><strong>Område</strong></td>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;">${escapeHtml(displayValue(lead.area))}</td>
            </tr>
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;"><strong>Storlek</strong></td>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;">${escapeHtml(displayValue(lead.squareMeters || lead.size))}</td>
            </tr>
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;"><strong>Källa</strong></td>
                <td style="padding:10px;border-bottom:1px solid #eeeeee;">${escapeHtml(displayValue(lead.source))}</td>
            </tr>
            <tr>
                <td style="padding:10px;"><strong>Registrerad</strong></td>
                <td style="padding:10px;">${escapeHtml(createdAt)}</td>
            </tr>
        </table>

        <p style="margin-top:26px;">
            Logga in i CRM och behandla kunden så snart som möjligt.
        </p>
    </div>
</body>
</html>
        `
    });

    return {
        skipped: false,
        messageId: info.messageId
    };
}

async function sendLeadCustomerSms(lead) {
    if (!lead.phone) {
        return {
            skipped: true,
            reason: "Customer phone is missing"
        };
    }

    const firstName =
        displayValue(lead.name, "")
            .split(/\s+/)
            .filter(Boolean)[0] || "";

    const greeting = firstName
        ? `Hej ${firstName}!`
        : "Hej!";

    const companyPhone =
        process.env.COMPANY_PHONE || "076-909 02 40";

    return sendSms(
        lead.phone,
`${greeting}

Tack för att du kontaktade J&W Quality Hemservice. Vi har tagit emot din offertförfrågan och är glada över möjligheten att hjälpa dig.

Vi går nu igenom dina önskemål och återkommer så snart som möjligt, vanligtvis inom 24 timmar på vardagar.

Tack för ditt förtroende!

J&W Quality Hemservice
${companyPhone}`
    );
}

async function sendLeadManagerSms(lead) {
    const managerPhone =
        process.env.LEAD_NOTIFICATION_PHONE ||
        process.env.COMPANY_PHONE;

    if (!managerPhone) {
        return {
            skipped: true,
            reason: "Manager notification phone is missing"
        };
    }

    const normalizedManagerPhone =
        normalizeSwedishPhone(managerPhone);

    const normalizedCustomerPhone =
        normalizeSwedishPhone(lead.phone);

    if (
        normalizedManagerPhone &&
        normalizedCustomerPhone &&
        normalizedManagerPhone === normalizedCustomerPhone
    ) {
        return {
            skipped: true,
            reason:
                "Manager and customer phone numbers are identical"
        };
    }

    return sendSms(
        normalizedManagerPhone || managerPhone,
`NY LEAD – J&W CRM

Namn: ${displayValue(lead.name)}
Telefon: ${displayValue(lead.phone)}
E-post: ${displayValue(lead.email)}
Tjänst: ${displayValue(lead.serviceType)}
Område: ${displayValue(lead.area)}
Storlek: ${displayValue(lead.squareMeters || lead.size)}
CRM-ID: ${displayValue(lead.id)}

Kontakta kunden så snart som möjligt.`
    );
}

module.exports = {
    sendLeadCustomerEmail,
    sendLeadManagerEmail,
    sendLeadCustomerSms,
    sendLeadManagerSms,
    normalizeSwedishPhone
};
