const twilio =
    require("twilio");

function isTwilioConfigured() {
    return Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_MESSAGING_SERVICE_SID
    );
}

function getClient() {
    return twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );
}

function getCustomerName(contract) {
    return contract.customer_first_name
        ? ` ${contract.customer_first_name}`
        : "";
}

function getManagerPhone() {
    return (
        process.env.ADMIN_PHONE ||
        process.env.MANAGER_PHONE ||
        ""
    ).trim();
}

async function sendContractSMS(
    contract,
    publicUrl
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
        getClient();

    const customerName =
        getCustomerName(contract);

    return client.messages.create({
        messagingServiceSid:
            process.env.TWILIO_MESSAGING_SERVICE_SID,

        to:
            contract.customer_phone,

        body:
`Hej${customerName}!

Ditt avtal med J&W Quality Hemservice är klart.

Läs avtalet och signera elektroniskt via den säkra länken:
${publicUrl}

Avtal: ${contract.contract_number}

J&W Quality Hemservice`
    });
}

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
        getClient();

    const customerName =
        getCustomerName(contract);

    return client.messages.create({
        messagingServiceSid:
            process.env.TWILIO_MESSAGING_SERVICE_SID,

        to:
            contract.customer_phone,

        body:
`Hej${customerName}!

Ditt avtal med J&W Quality Hemservice är nu elektroniskt signerat.

En kopia av det signerade avtalet har skickats till din e-post.

Avtal: ${contract.contract_number}

J&W Quality Hemservice`
    });
}

async function sendManagerSignedContractSMS(
    contract
) {
    const managerPhone =
        getManagerPhone();

    if (!managerPhone) {
        return {
            skipped: true,
            reason:
                "Manager phone number is missing"
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
        getClient();

    const customerName =
        [
            contract.customer_first_name,
            contract.customer_last_name
        ]
            .filter(Boolean)
            .join(" ");

    return client.messages.create({
        messagingServiceSid:
            process.env.TWILIO_MESSAGING_SERVICE_SID,

        to:
            managerPhone,

        body:
`Ett kundavtal har signerats.

Kund: ${customerName}
Avtal: ${contract.contract_number}

Det signerade avtalet har registrerats i J&W CRM.`
    });
}

module.exports = {
    sendContractSMS,
    sendSignedContractSMS,
    sendManagerSignedContractSMS
};