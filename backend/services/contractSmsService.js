const twilio = require("twilio");

function isTwilioConfigured() {
    return Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_MESSAGING_SERVICE_SID
    );
}

async function sendContractSMS(contract, publicUrl) {
    if (!contract.customer_phone) {
        return {
            skipped: true,
            reason: "Customer phone number is missing"
        };
    }

    if (!isTwilioConfigured()) {
        return {
            skipped: true,
            reason: "Twilio is not configured"
        };
    }

    const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );

    const customerName =
        contract.customer_first_name
            ? ` ${contract.customer_first_name}`
            : "";

    return client.messages.create({
        messagingServiceSid:
            process.env.TWILIO_MESSAGING_SERVICE_SID,

        to: contract.customer_phone,

        body:
`Hej${customerName}!

Ditt avtal med J&W Quality Hemservice är klart.

Läs avtalet och signera säkert med BankID:
${publicUrl}

Avtal: ${contract.contract_number}

J&W Quality Hemservice`
    });
}

module.exports = {
    sendContractSMS,
    sendSignedContractSMS
};

async function sendSignedContractSMS(
    contract
) {
    if (!contract.customer_phone) {
        return {
            skipped: true,
            reason:
                "Customer phone number is missing"
        };
    }

    if (!isTwilioConfigured()) {
        return {
            skipped: true,
            reason:
                "Twilio is not configured"
        };
    }

    const client =
        twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

    const customerName =
        contract.customer_first_name
            ? ` ${contract.customer_first_name}`
            : "";

    return client.messages.create({
        messagingServiceSid:
            process.env.TWILIO_MESSAGING_SERVICE_SID,

        to:
            contract.customer_phone,

        body:
`Hej${customerName}!

Ditt avtal med J&W Quality Hemservice är nu signerat med BankID.

En kopia av det signerade avtalet har skickats till din e-post.

Avtal: ${contract.contract_number}

J&W Quality Hemservice`
    });
}
