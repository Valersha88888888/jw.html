const crypto = require("crypto");

const {
    createContract,
    getContracts,
    getContractById,
    prepareContractForSending,
    deleteDraftContract,
    archiveContract
} = require("../services/contractService");

const {
    buildContractHtml
} = require("../templates/contractTemplate");

const {
    sendContractEmail
} = require("../services/contractEmailService");

const {
    sendContractSMS
} = require("../services/contractSmsService");

const log = require("../services/logService");


async function createContractController(req, res) {
    try {
        const contract =
            await createContract(req.body);

        log.info(
            `Contract created: ${contract.contract_number}`
        );

        res.status(201).json({
            success: true,
            contract
        });

    } catch (error) {
        log.error(
            `Contract creation failed: ${error.message}`
        );

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function getContractsController(req, res) {
    try {
        const contracts =
            await getContracts();

        res.json({
            success: true,
            contracts
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function getContractController(req, res) {
    try {
        const contract =
            await getContractById(req.params.id);

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: "Contract not found"
            });
        }

        res.json({
            success: true,
            contract
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function sendContractController(req, res) {
    try {
        const contract =
            await getContractById(req.params.id);

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: "Contract not found"
            });
        }

        if (contract.status === "signed") {
            return res.status(409).json({
                success: false,
                message:
                    "Ett signerat avtal kan inte skickas för ny signering."
            });
        }

        if (!contract.customer_email) {
            return res.status(400).json({
                success: false,
                message:
                    "Kundens e-postadress saknas."
            });
        }

        /*
         * IMPORTANT:
         * This exact HTML becomes the frozen
         * contract snapshot used for signing.
         */
        const contractText =
            buildContractHtml(contract);

        const contractHash =
            crypto
                .createHash("sha256")
                .update(
                    contractText,
                    "utf8"
                )
                .digest("hex");

        const baseUrl = (
            process.env.CONTRACT_PUBLIC_BASE_URL ||
            "http://localhost:3000"
        ).replace(/\/+$/, "");

        const publicUrl =
            `${baseUrl}/contract-sign.html?token=` +
            encodeURIComponent(
                contract.public_token
            );

        /*
         * Send first.
         *
         * We do not mark the contract as sent
         * before the main email has succeeded.
         */
        const emailResult =
            await sendContractEmail(
                contract,
                publicUrl
            );

        let smsResult;

        try {
            smsResult =
                await sendContractSMS(
                    contract,
                    publicUrl
                );

        } catch (smsError) {
            /*
             * Email has already succeeded.
             * SMS failure should therefore not
             * destroy the entire delivery.
             */
            log.error(
                `Contract SMS failed: ${smsError.message}`
            );

            smsResult = {
                success: false,
                error: smsError.message
            };
        }

        const updatedContract =
            await prepareContractForSending(
                contract.id,
                contractText,
                contractHash
            );

        log.info(
            `Contract sent: ${contract.contract_number}`
        );

        res.json({
            success: true,

            message:
                "Avtalet har skickats till kunden.",

            contract: updatedContract,

            delivery: {
                email: {
                    sent: true,
                    messageId:
                        emailResult.messageId || null
                },

                sms: {
                    sent:
                        !smsResult?.skipped &&
                        !smsResult?.error,

                    skipped:
                        Boolean(smsResult?.skipped),

                    reason:
                        smsResult?.reason || null,

                    error:
                        smsResult?.error || null,

                    sid:
                        smsResult?.sid || null
                }
            },

            publicUrl
        });

    } catch (error) {
        log.error(
            `Contract send failed: ${error.message}`
        );

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}



async function deleteContractController(req, res) {
    try {
        const contract =
            await deleteDraftContract(req.params.id);

        log.info(
            `Draft contract deleted: ${contract.contract_number}`
        );

        res.json({
            success: true,
            message: "Avtalet har tagits bort.",
            contractNumber:
                contract.contract_number
        });

    } catch (error) {
        log.error(
            `Contract deletion failed: ${error.message}`
        );

        if (
            error.message ===
            "Only draft contracts can be deleted"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Endast utkast kan raderas. Skickade, öppnade eller signerade avtal ska bevaras."
            });
        }

        if (
            error.message ===
            "Contract not found"
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Avtalet kunde inte hittas."
            });
        }

        res.status(500).json({
            success: false,
            message:
                "Avtalet kunde inte tas bort."
        });
    }
}


async function archiveContractController(req, res) {
    try {
        const contract =
            await archiveContract(
                req.params.id,
                req.user?.email ||
                req.user?.name ||
                "CRM admin",
                "Removed from active CRM view"
            );

        log.info(
            `Contract archived: ${contract.contract_number}`
        );

        res.json({
            success: true,
            message:
                "Avtalet har tagits bort från den aktiva listan och arkiverats.",
            contractNumber:
                contract.contract_number
        });

    } catch (error) {
        log.error(
            `Contract archive failed: ${error.message}`
        );

        if (
            error.message ===
            "Contract is already archived"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Avtalet är redan arkiverat."
            });
        }

        if (
            error.message ===
            "Draft contracts must use permanent deletion"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Utkast ska tas bort med vanlig borttagning."
            });
        }

        if (
            error.message ===
            "Contract not found"
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Avtalet kunde inte hittas."
            });
        }

        res.status(500).json({
            success: false,
            message:
                "Avtalet kunde inte arkiveras."
        });
    }
}

async function getContractPdfController(req, res) {
    try {
        const contract =
            await getContractById(
                req.params.id
            );

        if (!contract) {
            return res.status(404).json({
                success: false,
                message:
                    "Avtalet kunde inte hittas."
            });
        }

        if (
            contract.status !== "signed"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Avtalet är ännu inte signerat."
            });
        }

        if (!contract.pdf_data) {
            return res.status(404).json({
                success: false,
                message:
                    "Ingen signerad PDF finns sparad för avtalet."
            });
        }

        const filename =
            contract.pdf_filename ||
            `${contract.contract_number}-signed.pdf`;

        const mimeType =
            contract.pdf_mime_type ||
            "application/pdf";

        res.setHeader(
            "Content-Type",
            mimeType
        );

        res.setHeader(
            "Content-Disposition",
            `inline; filename="${filename}"`
        );

        res.setHeader(
            "Cache-Control",
            "private, no-store, max-age=0"
        );

        res.setHeader(
            "X-Content-Type-Options",
            "nosniff"
        );

        return res.send(
            contract.pdf_data
        );

    } catch (error) {
        console.error(
            "Contract PDF error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Den signerade PDF-filen kunde inte hämtas."
        });
    }
}

module.exports = {
    createContractController,
    getContractsController,
    getContractController,
    sendContractController,
    deleteContractController,
    archiveContractController,
getContractPdfController
};
