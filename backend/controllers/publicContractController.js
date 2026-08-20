const crypto = require("crypto");
const fs = require("fs");

const {
    generateOtpCode,
    hashOtpCode,
    verifyOtpCode,
    getOtpExpiryDate
} = require("../services/contractOtpService");

const {
    getContractByToken
} = require("../services/contractService");

const {
    pool
} = require("../config/db");

const {
    generateSignedContractPDF
} = require("../services/contractPdfService");

const {
    sendContractOtpEmail,
    sendSignedContractEmail,
    sendManagerSignedContractEmail
} = require("../services/contractEmailService");

const {
    sendSignedContractSMS,
    sendManagerSignedContractSMS
} = require("../services/contractSmsService");


/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

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


function normalizeName(value) {
    return String(value || "")
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("sv-SE");
}


function isContractExpired(contract) {
    return Boolean(
        contract.token_expires_at &&
        new Date(
            contract.token_expires_at
        ) < new Date()
    );
}


function isOtpExpired(contract) {
    return Boolean(
        contract.otp_expires_at &&
        new Date(
            contract.otp_expires_at
        ) < new Date()
    );
}


function validateSignatureImage(
    signatureImage
) {
    if (
        typeof signatureImage !==
        "string"
    ) {
        return null;
    }

    const match =
        signatureImage.match(
            /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/
        );

    if (!match) {
        return null;
    }

    let buffer;

    try {
        buffer =
            Buffer.from(
                match[1],
                "base64"
            );
    } catch {
        return null;
    }

    /*
     * Minsta storlek gör det svårare att
     * skicka en tom eller obetydlig bild.
     */
    if (
        buffer.length < 200 ||
        buffer.length > 2 * 1024 * 1024
    ) {
        return null;
    }

    return buffer;
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


/*
 * =========================================================
 * PUBLIC CONTRACT
 * =========================================================
 */

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
                    "Avtalslänken är ogiltig."
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
            isContractExpired(
                contract
            ) &&
            contract.status !== "signed"
        ) {
            return res.status(410).json({
                success: false,
                message:
                    "Avtalslänken har gått ut."
            });
        }

        if (
            contract.status === "draft"
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
                [
                    contract.id
                ]
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

        return res.json({
            success: true,

            contract: {
                contractNumber:
                    latest.contract_number,

                status:
                    latest.status,

                customerName:
                    [
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

                customerAddress:
                    [
                        latest.customer_address,
                        latest.customer_postal_code,
                        latest.customer_city
                    ]
                        .filter(Boolean)
                        .join(", "),

                serviceAddress:
                    [
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

                otpVerified:
                    Boolean(
                        latest.otp_verified_at
                    ) &&
                    !isOtpExpired(
                        latest
                    ),

                signedName:
                    latest.signed_name,

                signedAt:
                    latest.signed_at
            }
        });

    } catch (error) {
        console.error(
            "Public contract error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Avtalet kunde inte laddas."
        });
    }
}


/*
 * =========================================================
 * OTP REQUEST
 * =========================================================
 */

async function requestOtpController(
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
                    "Avtalslänken är ogiltig."
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
            contract.status === "draft"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Avtalet har ännu inte skickats."
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
            isContractExpired(
                contract
            )
        ) {
            return res.status(410).json({
                success: false,
                message:
                    "Avtalslänken har gått ut."
            });
        }

        if (!contract.customer_email) {
            return res.status(400).json({
                success: false,
                message:
                    "Kundens e-postadress saknas."
            });
        }

        const otpCode =
            generateOtpCode();

        const otpHash =
            await hashOtpCode(
                otpCode
            );

        const otpExpiresAt =
            getOtpExpiryDate();

        await pool.query(
            `
            UPDATE contracts
            SET
                otp_hash = $2,
                otp_expires_at = $3,
                otp_verified_at = NULL,
                otp_attempts = 0,
                updated_at = NOW()
            WHERE id = $1
            `,
            [
                contract.id,
                otpHash,
                otpExpiresAt
            ]
        );

        try {
            await sendContractOtpEmail(
                contract,
                otpCode
            );

        } catch (error) {
            await pool.query(
                `
                UPDATE contracts
                SET
                    otp_hash = NULL,
                    otp_expires_at = NULL,
                    otp_verified_at = NULL,
                    otp_attempts = 0,
                    updated_at = NOW()
                WHERE id = $1
                `,
                [
                    contract.id
                ]
            );

            throw error;
        }

        await addPublicEvent(
            contract.id,
            "otp_requested",
            "Verifieringskod skickades till kundens e-post.",
            {
                channel:
                    "email",

                expiresAt:
                    otpExpiresAt.toISOString()
            }
        );

        return res.json({
            success: true,

            message:
                "Verifieringskoden har skickats till din e-post."
        });

    } catch (error) {
        console.error(
            "OTP request error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Verifieringskoden kunde inte skickas."
        });
    }
}


/*
 * =========================================================
 * OTP VERIFY
 * =========================================================
 */

async function verifyOtpController(
    req,
    res
) {
    try {
        const token =
            String(
                req.params.token || ""
            ).trim();

        const code =
            String(
                req.body?.code || ""
            ).trim();

        if (!token) {
            return res.status(400).json({
                success: false,
                message:
                    "Avtalslänken är ogiltig."
            });
        }

        if (
            !/^\d{6}$/.test(
                code
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Ange en giltig sexsiffrig verifieringskod."
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
            contract.status === "draft"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Avtalet har ännu inte skickats."
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
            isContractExpired(
                contract
            )
        ) {
            return res.status(410).json({
                success: false,
                message:
                    "Avtalslänken har gått ut."
            });
        }

        if (
            !contract.otp_hash ||
            !contract.otp_expires_at
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Ingen aktiv verifieringskod finns. Begär en ny kod."
            });
        }

        const attempts =
            Number(
                contract.otp_attempts || 0
            );

        if (
            attempts >= 5
        ) {
            return res.status(429).json({
                success: false,
                message:
                    "För många felaktiga försök. Begär en ny verifieringskod."
            });
        }

        if (
            isOtpExpired(
                contract
            )
        ) {
            return res.status(410).json({
                success: false,
                message:
                    "Verifieringskoden har gått ut. Begär en ny kod."
            });
        }

        const valid =
            await verifyOtpCode(
                code,
                contract.otp_hash
            );

        if (!valid) {
            await pool.query(
                `
                UPDATE contracts
                SET
                    otp_attempts =
                        otp_attempts + 1,
                    updated_at = NOW()
                WHERE id = $1
                `,
                [
                    contract.id
                ]
            );

            await addPublicEvent(
                contract.id,
                "otp_failed",
                "Felaktig verifieringskod angavs.",
                {
                    attempt:
                        attempts + 1
                }
            );

            return res.status(401).json({
                success: false,
                message:
                    "Verifieringskoden är felaktig."
            });
        }

        const updated =
            await pool.query(
                `
                UPDATE contracts
                SET
                    otp_verified_at = NOW(),
                    otp_attempts = 0,
                    signer_email = customer_email,
                    signer_phone = customer_phone,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING
                    otp_verified_at
                `,
                [
                    contract.id
                ]
            );

        await addPublicEvent(
            contract.id,
            "otp_verified",
            "Kundens e-postadress verifierades med engångskod.",
            {
                verifiedAt:
                    updated
                        .rows[0]
                        .otp_verified_at
            }
        );

        return res.json({
            success: true,

            verified: true,

            verifiedAt:
                updated
                    .rows[0]
                    .otp_verified_at,

            message:
                "Verifieringen lyckades."
        });

    } catch (error) {
        console.error(
            "OTP verify error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Verifieringen kunde inte genomföras."
        });
    }
}


/*
 * =========================================================
 * ELECTRONIC SIGNING
 * =========================================================
 */

async function signContractController(
    req,
    res
) {
    const client =
        await pool.connect();

    let signedContract =
        null;

    let signedPdf =
        null;

    try {
        const token =
            String(
                req.params.token || ""
            ).trim();

        const signedName =
            String(
                req.body?.signedName || ""
            )
                .trim()
                .replace(/\s+/g, " ");

        const signatureImage =
            String(
                req.body?.signatureImage || ""
            );

        const consents =
            req.body?.consents || {};

        const electronicSignatureAccepted =
            req.body
                ?.electronicSignatureAccepted ===
            true;

        if (!token) {
            return res.status(400).json({
                success: false,
                message:
                    "Avtalslänken är ogiltig."
            });
        }

        if (signedName.length < 2) {
            return res.status(400).json({
                success: false,
                message:
                    "Ange ditt fullständiga namn."
            });
        }

        const allConsentsAccepted =
            consents.read === true &&
            consents.binding === true &&
            consents.price === true &&
            consents.cancellation === true &&
            consents.withdrawal === true;

        if (!allConsentsAccepted) {
            return res.status(400).json({
                success: false,
                message:
                    "Samtliga avtalsvillkor måste bekräftas innan avtalet kan signeras."
            });
        }

        if (
            !electronicSignatureAccepted
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Du måste bekräfta att du accepterar avtalet genom din elektroniska signatur."
            });
        }

        const signatureBuffer =
            validateSignatureImage(
                signatureImage
            );

        if (!signatureBuffer) {
            return res.status(400).json({
                success: false,
                message:
                    "Signaturen är ogiltig eller kunde inte läsas."
            });
        }

        await client.query(
            "BEGIN"
        );

        const result =
            await client.query(
                `
                SELECT *
                FROM contracts
                WHERE public_token = $1
                FOR UPDATE
                `,
                [
                    token
                ]
            );

        const contract =
            result.rows[0];

        if (!contract) {
            await client.query(
                "ROLLBACK"
            );

            return res.status(404).json({
                success: false,
                message:
                    "Avtalet kunde inte hittas."
            });
        }

        if (
            contract.status === "draft"
        ) {
            await client.query(
                "ROLLBACK"
            );

            return res.status(403).json({
                success: false,
                message:
                    "Avtalet har ännu inte skickats."
            });
        }

        if (
            contract.status === "signed"
        ) {
            await client.query(
                "ROLLBACK"
            );

            return res.status(409).json({
                success: false,
                message:
                    "Avtalet är redan signerat."
            });
        }

        if (
            isContractExpired(
                contract
            )
        ) {
            await client.query(
                "ROLLBACK"
            );

            return res.status(410).json({
                success: false,
                message:
                    "Avtalslänken har gått ut."
            });
        }

        if (
            !contract.otp_verified_at ||
            !contract.otp_hash ||
            !contract.otp_expires_at
        ) {
            await client.query(
                "ROLLBACK"
            );

            return res.status(403).json({
                success: false,
                message:
                    "E-postadressen måste verifieras innan avtalet kan signeras."
            });
        }

        if (
            isOtpExpired(
                contract
            )
        ) {
            await client.query(
                "ROLLBACK"
            );

            return res.status(410).json({
                success: false,
                message:
                    "Verifieringen har gått ut. Begär en ny verifieringskod."
            });
        }

        const expectedName =
            [
                contract.customer_first_name,
                contract.customer_last_name
            ]
                .filter(Boolean)
                .join(" ");

        if (
            normalizeName(
                expectedName
            ) !==
            normalizeName(
                signedName
            )
        ) {
            await client.query(
                "ROLLBACK"
            );

            return res.status(409).json({
                success: false,
                message:
                    "Namnet måste stämma överens med personen som står på avtalet."
            });
        }

        const signerIp =
            getEndUserIp(
                req
            );

        const signerUserAgent =
            String(
                req.headers[
                    "user-agent"
                ] || ""
            ).slice(
                0,
                1000
            );

        const signatureHash =
            crypto
                .createHash(
                    "sha256"
                )
                .update(
                    signatureBuffer
                )
                .digest(
                    "hex"
                );

        const signedAt =
            new Date();

        const signingEvidence = {
            version:
                1,

            method:
                "email_otp_drawn_signature",

            contractNumber:
                contract.contract_number,

            contractVersion:
                contract.contract_version,

            contractHash:
                contract.contract_hash,

            signedName,

            verifiedEmail:
                contract.customer_email,

            verifiedPhone:
                contract.customer_phone ||
                null,

            otpVerifiedAt:
                contract.otp_verified_at,

            signedAt:
                signedAt.toISOString(),

            signatureHash,

            ipAddress:
                signerIp ||
                null,

            userAgent:
                signerUserAgent ||
                null,

            consents: {
                read:
                    true,

                binding:
                    true,

                price:
                    true,

                cancellation:
                    true,

                withdrawal:
                    true,

                electronicSignature:
                    true
            }
        };

        const updated =
            await client.query(
                `
                UPDATE contracts
                SET
                    status = 'signed',

                    signature_method =
                        'email_otp_drawn_signature',

                    signature_image = $2,
                    signature_hash = $3,

                    signer_email =
                        customer_email,

                    signer_phone =
                        customer_phone,

                    signer_ip = $4,
                    signer_user_agent = $5,

                    consent_read = TRUE,
                    consent_binding = TRUE,
                    consent_price = TRUE,
                    consent_cancellation = TRUE,
                    consent_withdrawal = TRUE,
                    consent_accepted_at = $6,

                    signed_name = $7,
                    signed_at = $6,

                    signing_evidence = $8::jsonb,

                    otp_hash = NULL,
                    otp_expires_at = NULL,

                    updated_at = NOW()

                WHERE id = $1

                RETURNING *
                `,
                [
                    contract.id,
                    signatureImage,
                    signatureHash,
                    signerIp,
                    signerUserAgent,
                    signedAt,
                    signedName,
                    JSON.stringify(
                        signingEvidence
                    )
                ]
            );

        signedContract =
            updated.rows[0];

        await client.query(
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
                signedContract.id,

                "signed",

                "Avtalet signerades elektroniskt efter verifiering med engångskod.",

                JSON.stringify({
                    method:
                        signingEvidence.method,

                    signedName,

                    signatureHash,

                    signedAt:
                        signedAt.toISOString()
                })
            ]
        );

        await client.query(
            "COMMIT"
        );

    } catch (error) {
        try {
            await client.query(
                "ROLLBACK"
            );
        } catch {
            // Ignore rollback error.
        }

        console.error(
            "Electronic signing error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Avtalet kunde inte signeras."
        });

    } finally {
        client.release();
    }


    /*
     * =====================================================
     * PDF
     * =====================================================
     */

    try {
        signedPdf =
            await generateSignedContractPDF(
                signedContract
            );

        const pdfBuffer =
            await fs.promises.readFile(
                signedPdf.outputPath
            );

        const pdfFilename =
            String(
                signedPdf.outputPath
            )
                .split(/[\\/]/)
                .pop();

        const pdfMimeType =
            "application/pdf";

        const pdfUpdate =
            await pool.query(
                `
                UPDATE contracts
                SET
                    pdf_path = $2,
                    pdf_hash = $3,
                    pdf_data = $4,
                    pdf_filename = $5,
                    pdf_mime_type = $6,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
                `,
                [
                    signedContract.id,
                    signedPdf.outputPath,
                    signedPdf.pdfHash,
                    pdfBuffer,
                    pdfFilename,
                    pdfMimeType
                ]
            );

        Object.assign(
            signedContract,
            pdfUpdate.rows[0]
        );

        await addPublicEvent(
            signedContract.id,
            "signed_pdf_created",
            "Signerad PDF skapades och sparades säkert i CRM.",
            {
                pdfHash:
                    signedPdf.pdfHash,

                filename:
                    pdfFilename,

                sizeBytes:
                    pdfBuffer.length,

                mimeType:
                    pdfMimeType,

                storage:
                    "postgresql"
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


    /*
     * =====================================================
     * CUSTOMER EMAIL
     * =====================================================
     */

    if (signedPdf) {
        try {
            await sendSignedContractEmail(
                signedContract,
                signedPdf.outputPath
            );

            await addPublicEvent(
                signedContract.id,
                "signed_email_sent",
                "Signerad avtalskopia skickades till kunden via e-post."
            );

        } catch (error) {
            console.error(
                "Signed customer email failed:",
                error
            );

            await addPublicEvent(
                signedContract.id,
                "signed_email_failed",
                "Signerad avtalskopia kunde inte skickas till kunden via e-post.",
                {
                    error:
                        error.message
                }
            );
        }


        /*
         * =================================================
         * MANAGER EMAIL
         * =================================================
         */

        try {
            await sendManagerSignedContractEmail(
                signedContract,
                signedPdf.outputPath
            );

            await addPublicEvent(
                signedContract.id,
                "manager_signed_email_sent",
                "Information om signerat avtal skickades till J&W via e-post."
            );

        } catch (error) {
            console.error(
                "Manager signed email failed:",
                error
            );

            await addPublicEvent(
                signedContract.id,
                "manager_signed_email_failed",
                "E-post till J&W kunde inte skickas.",
                {
                    error:
                        error.message
                }
            );
        }
    }


    /*
     * =====================================================
     * CUSTOMER SMS
     * =====================================================
     */

    try {
        const smsResult =
            await sendSignedContractSMS(
                signedContract
            );

        await addPublicEvent(
            signedContract.id,

            smsResult?.skipped
                ? "signed_sms_skipped"
                : "signed_sms_sent",

            smsResult?.skipped
                ? "SMS efter signering skickades inte till kunden."
                : "Bekräftelse efter signering skickades till kunden via SMS.",

            smsResult?.skipped
                ? {
                    reason:
                        smsResult.reason ||
                        null
                }
                : null
        );

    } catch (error) {
        console.error(
            "Signed customer SMS failed:",
            error
        );

        await addPublicEvent(
            signedContract.id,
            "signed_sms_failed",
            "SMS efter signering kunde inte skickas till kunden.",
            {
                error:
                    error.message
            }
        );
    }


    /*
     * =====================================================
     * MANAGER SMS
     * =====================================================
     */

    try {
        const managerSmsResult =
            await sendManagerSignedContractSMS(
                signedContract
            );

        await addPublicEvent(
            signedContract.id,

            managerSmsResult?.skipped
                ? "manager_signed_sms_skipped"
                : "manager_signed_sms_sent",

            managerSmsResult?.skipped
                ? "SMS till J&W skickades inte."
                : "Information om signerat avtal skickades till J&W via SMS.",

            managerSmsResult?.skipped
                ? {
                    reason:
                        managerSmsResult.reason ||
                        null
                }
                : null
        );

    } catch (error) {
        console.error(
            "Manager signed SMS failed:",
            error
        );

        await addPublicEvent(
            signedContract.id,
            "manager_signed_sms_failed",
            "SMS till J&W kunde inte skickas.",
            {
                error:
                    error.message
            }
        );
    }


    return res.json({
        success: true,

        status:
            "signed",

        message:
            "Avtalet har signerats elektroniskt.",

        contract: {
            contractNumber:
                signedContract
                    .contract_number,

            status:
                signedContract
                    .status,

            signedName:
                signedContract
                    .signed_name,

            signedAt:
                signedContract
                    .signed_at
        }
    });
}


module.exports = {
    getPublicContractController,
    requestOtpController,
    verifyOtpController,
    signContractController
};