const crypto = require("crypto");
const QRCode = require("qrcode");

const {
    getContractByToken
} = require("../services/contractService");

const {
    startSign,
    collectSign
} = require("../services/bankidService");

const { pool } = require("../config/db");
const {
    generateSignedContractPDF
} = require("../services/contractPdfService");

const {
    sendSignedContractEmail
} = require("../services/contractEmailService");

const {
    sendSignedContractSMS
} = require("../services/contractSmsService");



function maskPersonnummer(value) {
    if (!value) {
        return "";
    }

    const clean =
        String(value)
            .replace(/\D/g, "");

    if (clean.length < 4) {
        return "****";
    }

    return (
        "*".repeat(
            Math.max(
                0,
                clean.length - 4
            )
        ) +
        clean.slice(-4)
    );
}


function normalizePersonnummer(value) {
    if (!value) {
        return "";
    }

    return String(value)
        .replace(/\D/g, "")
        .trim();
}


function getEndUserIp(req) {
    const forwarded =
        req.headers["x-forwarded-for"];

    if (forwarded) {
        return String(forwarded)
            .split(",")[0]
            .trim();
    }

    return (
        req.socket?.remoteAddress ||
        req.ip ||
        ""
    ).replace(
        "::ffff:",
        ""
    );
}


async function addPublicEvent(
    contractId,
    eventType,
    description,
    metadata = null
) {
    await pool.query(
        `
        INSERT INTO contract_events (
            contract_id,
            event_type,
            description,
            metadata
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
            contractId,
            eventType,
            description,
            metadata
                ? JSON.stringify(metadata)
                : null
        ]
    );
}


async function getPublicContractController(
    req,
    res
) {
    try {
        const token =
            String(
                req.params.token || ""
            ).trim();

        if (!token) {
            return res.status(400).json({
                success: false,
                message:
                    "Ogiltig avtalslänk."
            });
        }

        const contract =
            await getContractByToken(
                token
            );

        if (!contract) {
            return res.status(404).json({
                success: false,
                message:
                    "Avtalet kunde inte hittas."
            });
        }

        if (
            contract.token_expires_at &&
            new Date(
                contract.token_expires_at
            ) < new Date() &&
            contract.status !== "signed"
        ) {
            return res.status(410).json({
                success: false,
                message:
                    "Avtalslänken har gått ut."
            });
        }

        if (
            contract.status ===
            "draft"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Avtalet har ännu inte skickats."
            });
        }

        if (
            !contract.opened_at &&
            contract.status === "sent"
        ) {
            await pool.query(
                `
                UPDATE contracts
                SET
                    opened_at = NOW(),
                    status = 'opened',
                    updated_at = NOW()
                WHERE id = $1
                `,
                [contract.id]
            );

            await addPublicEvent(
                contract.id,
                "opened",
                "Kunden öppnade avtalet."
            );
        }

        const latest =
            await getContractByToken(
                token
            );

        res.json({
            success: true,

            contract: {
                contractNumber:
                    latest.contract_number,

                status:
                    latest.status,

                customerName: [
                    latest.customer_first_name,
                    latest.customer_last_name
                ]
                    .filter(Boolean)
                    .join(" "),

                customerPersonnummer:
                    maskPersonnummer(
                        latest.customer_personnummer
                    ),

                customerEmail:
                    latest.customer_email,

                customerPhone:
                    latest.customer_phone,

                customerAddress: [
                    latest.customer_address,
                    latest.customer_postal_code,
                    latest.customer_city
                ]
                    .filter(Boolean)
                    .join(", "),

                serviceAddress: [
                    latest.service_address,
                    latest.service_postal_code,
                    latest.service_city
                ]
                    .filter(Boolean)
                    .join(", "),

                serviceAreaM2:
                    latest.service_area_m2,

                serviceFrequency:
                    latest.service_frequency,

                serviceHours:
                    latest.service_hours,

                serviceDay:
                    latest.service_day,

                serviceTime:
                    latest.service_time,

                startDate:
                    latest.start_date,

                introPrice:
                    latest.intro_price,

                introCleanings:
                    latest.intro_cleanings,

                regularPrice:
                    latest.regular_price,

                bindingMonths:
                    latest.binding_months,

                terminationDays:
                    latest.termination_days,

                cancellationHours:
                    latest.cancellation_hours,

                contractVersion:
                    latest.contract_version,

                contractHash:
                    latest.contract_hash,

                contractHtml:
                    latest.contract_text,

                companyApproved:
                    latest.company_approved,

                companyApprovedName:
                    latest.company_approved_name,

                signedAt:
                    latest.signed_at
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Avtalet kunde inte laddas."
        });
    }
}


async function startBankIdController(
    req,
    res
) {
    try {
        const token =
            String(
                req.params.token || ""
            ).trim();

        const contract =
            await getContractByToken(
                token
            );

        if (!contract) {
            return res.status(404).json({
                success: false,
                message:
                    "Avtalet kunde inte hittas."
            });
        }

        if (
            contract.status ===
            "draft"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Avtalet har ännu inte skickats."
            });
        }

        if (
            contract.status ===
            "signed"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Avtalet är redan signerat."
            });
        }

        if (
            contract.token_expires_at &&
            new Date(
                contract.token_expires_at
            ) < new Date()
        ) {
            return res.status(410).json({
                success: false,
                message:
                    "Avtalslänken har gått ut."
            });
        }

        const endUserIp =
            getEndUserIp(req);

        if (!endUserIp) {
            return res.status(400).json({
                success: false,
                message:
                    "Kundens IP-adress kunde inte fastställas."
            });
        }

        const visibleText =
`J&W Quality Hemservice

Du signerar avtal:
${contract.contract_number}

Tjänst:
Återkommande hemstädning

Viktiga villkor:
- 149 kr/timme efter preliminärt RUT-avdrag för de första 3 städtillfällena.
- 250 kr/timme efter preliminärt RUT-avdrag från städtillfälle 4.
- Bindningstid: 12 månader.
- Därefter: 30 dagars uppsägningstid.
- Ombokning eller avbokning ska ske senast 24 timmar före bokad starttid enligt avtalsvillkoren.

Genom signeringen bekräftar du att du har läst och accepterat avtalet.`;

        const nonVisibleText =
            JSON.stringify({
                contractNumber:
                    contract.contract_number,

                contractVersion:
                    contract.contract_version,

                contractHash:
                    contract.contract_hash
            });

        const bankIdResult =
            await startSign({
                endUserIp,
                visibleText,
                nonVisibleText
            });

        await pool.query(
            `
            UPDATE contracts
            SET
                bankid_order_ref = $2,
                bankid_qr_start_token = $3,
                bankid_qr_start_secret = $4,
                bankid_started_at = NOW(),
                status = 'signing',
                updated_at = NOW()
            WHERE id = $1
            `,
            [
                contract.id,
                bankIdResult.orderRef,
                bankIdResult.qrStartToken,
                bankIdResult.qrStartSecret
            ]
        );

        await addPublicEvent(
            contract.id,
            "bankid_started",
            "BankID-signering startades.",
            {
                orderRef:
                    bankIdResult.orderRef
            }
        );

        res.json({
            success: true,

            bankId: {
                orderRef:
                    bankIdResult.orderRef,

                autoStartToken:
                    bankIdResult.autoStartToken
            }
        });

    } catch (error) {
        console.error(
            "BankID start error:",
            error
        );

        res.status(
            error.statusCode || 500
        ).json({
            success: false,

            message:
                error.bankId?.details ||
                error.message ||
                "BankID-signeringen kunde inte startas.",

            bankIdError:
                error.bankId?.errorCode ||
                null
        });
    }
}


async function collectBankIdController(
    req,
    res
) {
    try {
        const token =
            String(
                req.params.token || ""
            ).trim();

        const contract =
            await getContractByToken(
                token
            );

        if (!contract) {
            return res.status(404).json({
                success: false,
                message:
                    "Avtalet kunde inte hittas."
            });
        }

        if (
            contract.status ===
            "signed"
        ) {
            return res.json({
                success: true,
                status: "complete",
                alreadySigned: true
            });
        }

        if (
            !contract.bankid_order_ref
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Ingen aktiv BankID-signering finns för avtalet."
            });
        }

        const result =
            await collectSign(
                contract.bankid_order_ref
            );

        if (
            result.status ===
            "pending"
        ) {
            return res.json({
                success: true,
                status: "pending",
                hintCode:
                    result.hintCode ||
                    null
            });
        }

        if (
            result.status ===
            "failed"
        ) {
            await pool.query(
                `
                UPDATE contracts
                SET
                    status = 'opened',
                    bankid_order_ref = NULL,
                    bankid_qr_start_token = NULL,
                    bankid_qr_start_secret = NULL,
                    bankid_started_at = NULL,
                    updated_at = NOW()
                WHERE id = $1
                `,
                [contract.id]
            );

            await addPublicEvent(
                contract.id,
                "bankid_failed",
                "BankID-signeringen misslyckades eller avbröts.",
                {
                    hintCode:
                        result.hintCode ||
                        null
                }
            );

            return res.json({
                success: true,
                status: "failed",
                hintCode:
                    result.hintCode ||
                    null
            });
        }

        if (
            result.status !==
            "complete"
        ) {
            return res.json({
                success: true,
                status:
                    result.status ||
                    "unknown"
            });
        }

        const completionData =
            result.completionData;

        const bankIdUser =
            completionData?.user;

        if (
            !bankIdUser ||
            !bankIdUser.personalNumber
        ) {
            throw new Error(
                "BankID returnerade ingen verifierad användare."
            );
        }

        const expectedPersonnummer =
            normalizePersonnummer(
                contract.customer_personnummer
            );

        const signedPersonnummer =
            normalizePersonnummer(
                bankIdUser.personalNumber
            );

        if (
            expectedPersonnummer &&
            expectedPersonnummer !==
                signedPersonnummer
        ) {
            await addPublicEvent(
                contract.id,
                "bankid_identity_mismatch",
                "BankID-identiteten matchade inte avtalets kund.",
                {
                    signedName:
                        bankIdUser.name,

                    signedPersonnummer:
                        signedPersonnummer
                }
            );

            return res.status(409).json({
                success: false,
                message:
                    "BankID-identiteten matchar inte den person som står på avtalet."
            });
        }

        const updated =
            await pool.query(
                `
                UPDATE contracts
                SET
                    status = 'signed',

                    signed_name = $2,
                    signed_personnummer = $3,
                    signed_at = NOW(),

                    bankid_signature = $4,
                    bankid_ocsp_response = $5,

                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
                `,
                [
                    contract.id,

                    bankIdUser.name,

                    bankIdUser.personalNumber,

                    completionData.signature,

                    completionData.ocspResponse
                ]
            );

        await addPublicEvent(
            contract.id,
            "signed",
            "Avtalet signerades med BankID.",
            {
                signedName:
                    bankIdUser.name,

                deviceIp:
                    completionData.device
                        ?.ipAddress ||
                    null
            }
        );

        const signedContract =
            updated.rows[0];

        let signedPdf = null;

        try {
            signedPdf =
                await generateSignedContractPDF(
                    signedContract
                );

            const pdfUpdate =
                await pool.query(
                    `
                    UPDATE contracts
                    SET
                        pdf_path = $2,
                        pdf_hash = $3,
                        updated_at = NOW()
                    WHERE id = $1
                    RETURNING *
                    `,
                    [
                        signedContract.id,
                        signedPdf.outputPath,
                        signedPdf.pdfHash
                    ]
                );

            Object.assign(
                signedContract,
                pdfUpdate.rows[0]
            );

            await addPublicEvent(
                signedContract.id,
                "signed_pdf_created",
                "Signerad PDF skapades.",
                {
                    pdfHash:
                        signedPdf.pdfHash
                }
            );

        } catch (error) {
            console.error(
                "Signed PDF generation failed:",
                error
            );

            await addPublicEvent(
                signedContract.id,
                "signed_pdf_failed",
                "Signerad PDF kunde inte skapas.",
                {
                    error:
                        error.message
                }
            );
        }


        if (signedPdf) {
            try {
                await sendSignedContractEmail(
                    signedContract,
                    signedPdf.outputPath
                );

                await addPublicEvent(
                    signedContract.id,
                    "signed_email_sent",
                    "Signerad avtalskopia skickades via e-post."
                );

            } catch (error) {
                console.error(
                    "Signed contract email failed:",
                    error
                );

                await addPublicEvent(
                    signedContract.id,
                    "signed_email_failed",
                    "Signerad avtalskopia kunde inte skickas via e-post.",
                    {
                        error:
                            error.message
                    }
                );
            }
        }


        try {
            const smsResult =
                await sendSignedContractSMS(
                    signedContract
                );

            if (smsResult?.skipped) {
                await addPublicEvent(
                    signedContract.id,
                    "signed_sms_skipped",
                    "SMS efter signering skickades inte.",
                    {
                        reason:
                            smsResult.reason ||
                            null
                    }
                );

            } else {
                await addPublicEvent(
                    signedContract.id,
                    "signed_sms_sent",
                    "Bekräftelse efter signering skickades via SMS."
                );
            }

        } catch (error) {
            console.error(
                "Signed contract SMS failed:",
                error
            );

            await addPublicEvent(
                signedContract.id,
                "signed_sms_failed",
                "SMS efter signering kunde inte skickas.",
                {
                    error:
                        error.message
                }
            );
        }

        res.json({
            success: true,

            status: "complete",

            contract: {
                contractNumber:
                    updated.rows[0]
                        .contract_number,

                status:
                    updated.rows[0]
                        .status,

                signedName:
                    updated.rows[0]
                        .signed_name,

                signedAt:
                    updated.rows[0]
                        .signed_at
            }
        });

    } catch (error) {
        console.error(
            "BankID collect error:",
            error
        );

        res.status(
            error.statusCode || 500
        ).json({
            success: false,

            message:
                error.bankId?.details ||
                error.message ||
                "BankID-status kunde inte hämtas.",

            bankIdError:
                error.bankId?.errorCode ||
                null
        });
    }
}



async function getBankIdQrController(req, res) {
    try {
        const token =
            String(
                req.params.token || ""
            ).trim();

        const contract =
            await getContractByToken(
                token
            );

        if (!contract) {
            return res.status(404).json({
                success: false,
                message:
                    "Avtalet kunde inte hittas."
            });
        }

        if (
            contract.status === "signed"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Avtalet är redan signerat."
            });
        }

        if (
            !contract.bankid_qr_start_token ||
            !contract.bankid_qr_start_secret ||
            !contract.bankid_started_at
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Ingen aktiv BankID-signering finns."
            });
        }

        const startedAt =
            new Date(
                contract.bankid_started_at
            ).getTime();

        const elapsedSeconds =
            Math.max(
                0,
                Math.floor(
                    (
                        Date.now() -
                        startedAt
                    ) / 1000
                )
            ).toString();

        const qrAuthCode =
            crypto
                .createHmac(
                    "sha256",
                    contract.bankid_qr_start_secret
                )
                .update(
                    elapsedSeconds
                )
                .digest("hex");

        const qrData =
            [
                "bankid",
                contract.bankid_qr_start_token,
                elapsedSeconds,
                qrAuthCode
            ].join(".");

        const qrImage =
            await QRCode.toDataURL(
                qrData,
                {
                    errorCorrectionLevel: "L",
                    width: 320,
                    margin: 3
                }
            );

        res.json({
            success: true,
            qrImage
        });

    } catch (error) {
        console.error(
            "BankID QR error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "QR-koden kunde inte genereras."
        });
    }
}

module.exports = {
    getPublicContractController,
    startBankIdController,
    collectBankIdController,
    getBankIdQrController
};
