const fs = require("fs");
const path = require("path");

function fileIsUsable(filePath) {
    try {
        return (
            fs.existsSync(filePath) &&
            fs.statSync(filePath).isFile() &&
            fs.statSync(filePath).size > 0
        );
    } catch {
        return false;
    }
}

function prepareBankIdCertificate() {
    const environment =
        String(process.env.BANKID_ENV || "test")
            .trim()
            .toLowerCase();

    const targetPath =
        String(
            process.env.BANKID_CERT_PATH || ""
        ).trim();

    if (!targetPath) {
        throw new Error(
            "BANKID_CERT_PATH is not configured."
        );
    }

    /*
     * If a valid certificate already exists,
     * nothing needs to be generated.
     */
    if (fileIsUsable(targetPath)) {
        console.log(
            `[BankID] Certificate ready: ${path.basename(targetPath)}`
        );

        return;
    }

    /*
     * Render stores the binary P12 as Base64 text.
     * The path can be overridden with an environment
     * variable later if needed.
     */
    const defaultBase64Path =
        environment === "test"
            ? "/etc/secrets/FPTestcert5_20240610.p12.b64"
            : "/etc/secrets/bankid-production.p12.b64";

    const base64Path =
        String(
            process.env.BANKID_CERT_B64_PATH ||
            defaultBase64Path
        ).trim();

    if (!fileIsUsable(base64Path)) {

        throw new Error(
            `BankID certificate is missing. ` +
            `Neither "${targetPath}" nor ` +
            `"${base64Path}" contains a usable certificate.`
        );
    }

    const encoded =
        fs.readFileSync(
            base64Path,
            "utf8"
        )
        .replace(/\s+/g, "");

    if (!encoded) {
        throw new Error(
            "BankID Base64 certificate file is empty."
        );
    }

    const certificate =
        Buffer.from(
            encoded,
            "base64"
        );

    if (!certificate.length) {
        throw new Error(
            "BankID certificate could not be decoded."
        );
    }

    fs.mkdirSync(
        path.dirname(targetPath),
        {
            recursive: true
        }
    );

    fs.writeFileSync(
        targetPath,
        certificate,
        {
            mode: 0o600
        }
    );

    if (!fileIsUsable(targetPath)) {
        throw new Error(
            "Decoded BankID certificate was not created correctly."
        );
    }

    console.log(
        `[BankID] Certificate prepared: ` +
        `${path.basename(targetPath)} ` +
        `(${certificate.length} bytes, environment=${environment})`
    );
}

try {

    prepareBankIdCertificate();

} catch (error) {

    console.error(
        "[BankID] Certificate preparation failed:",
        error.message
    );

    process.exit(1);
}
