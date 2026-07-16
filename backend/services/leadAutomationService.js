const log = require("./logService");

const {
    sendLeadCustomerEmail,
    sendLeadManagerEmail,
    sendLeadCustomerSms,
    sendLeadManagerSms
} = require("./leadNotificationService");

async function runLeadAutomation(lead) {
    const jobs = [
        {
            name: "customer-email",
            execute: () => sendLeadCustomerEmail(lead)
        },
        {
            name: "manager-email",
            execute: () => sendLeadManagerEmail(lead)
        },
        {
            name: "customer-sms",
            execute: () => sendLeadCustomerSms(lead)
        },
        {
            name: "manager-sms",
            execute: () => sendLeadManagerSms(lead)
        }
    ];

    const settled = await Promise.allSettled(
        jobs.map((job) => job.execute())
    );

    const results = settled.map((result, index) => {
        const name = jobs[index].name;

        if (result.status === "fulfilled") {
            const value = result.value || {};

            if (value.skipped) {
                log.info(
                    `Lead automation skipped: ${name}; reason=${value.reason}`
                );

                return {
                    name,
                    status: "skipped",
                    reason: value.reason
                };
            }

            log.info(
                `Lead automation completed: ${name}; leadId=${lead.id}`
            );

            return {
                name,
                status: "fulfilled"
            };
        }

        log.error(
            `Lead automation failed: ${name}; leadId=${lead.id}; error=${result.reason?.message || result.reason}`
        );

        return {
            name,
            status: "rejected",
            error:
                result.reason?.message ||
                String(result.reason)
        };
    });

    return results;
}

module.exports = {
    runLeadAutomation
};
