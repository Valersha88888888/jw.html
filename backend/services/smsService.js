const twilio = require("twilio");
require("dotenv").config();

function isTwilioConfigured() {
    return Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_MESSAGING_SERVICE_SID
    );
}

async function sendOfferSMS(customer) {
    if (!customer || !customer.phone) {
        return {
            skipped: true,
            reason: "Customer phone number is missing"
        };
    }

    if (!isTwilioConfigured()) {
        console.warn(
            "SMS skipped: Twilio Messaging Service is not configured."
        );

        return {
            skipped: true,
            reason: "Twilio is not configured"
        };
    }

    const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );

    const customerName = customer.name
        ? ` ${customer.name}`
        : "";

    const offerNumber = customer.offerNumber
        ? ` ${customer.offerNumber}`
        : "";

    const companyPhone =
        process.env.COMPANY_PHONE || "076-909 02 40";

    return client.messages.create({
        messagingServiceSid:
            process.env.TWILIO_MESSAGING_SERVICE_SID,

        to: customer.phone,

        body:
`Hej${customerName}!

Din offert${offerNumber} från J&W Quality Hemservice är nu klar och har skickats till din e-post.

Har du några frågor är du varmt välkommen att kontakta oss på ${companyPhone}.

Med vänliga hälsningar
J&W Quality Hemservice`
    });
}

module.exports = {
    sendOfferSMS
};
