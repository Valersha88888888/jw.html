const fs = require("fs");
const path = require("path");
const https = require("https");

function requireEnv(name) {
    const value =
        String(
            process.env[name] || ""
        ).trim();

    if (!value) {
        throw new Error(
            `${name} is missing`
        );
    }

    return value;
}


function resolveBackendPath(value) {
    return path.resolve(
        __dirname,
        "..",
        value
    );
}


function getBankIdEnvironment() {
    const environment =
        String(
            process.env.BANKID_ENV || "test"
        )
            .trim()
            .toLowerCase();

    if (
        environment !== "test" &&
        environment !== "production"
    ) {
        throw new Error(
            "BANKID_ENV must be test or production"
        );
    }

    return environment;
}

function validateBankIdConfig({
    environment,
    baseUrl,
    certPath,
    caPath
}) {
    let url;

    try {
        url = new URL(baseUrl);
    } catch {
        throw new Error(
            `Invalid BankID URL: ${baseUrl}`
        );
    }

    if (url.protocol !== "https:") {
        throw new Error(
            "BankID URL must use HTTPS"
        );
    }

    if (environment === "test") {
        if (
            url.hostname !==
            "appapi2.test.bankid.com"
        ) {
            throw new Error(
                "BANKID_ENV=test must use appapi2.test.bankid.com"
            );
        }
    }

    if (environment === "production") {
        if (
            url.hostname !==
            "appapi2.bankid.com"
        ) {
            throw new Error(
                "BANKID_ENV=production must use appapi2.bankid.com"
            );
        }

        const certName =
            path.basename(
                certPath
            ).toLowerCase();

        const caName =
            path.basename(
                caPath
            ).toLowerCase();

        if (
            certName.includes("fptest") ||
            certName.includes("test")
        ) {
            throw new Error(
                "Production BankID cannot use a test certificate"
            );
        }

        if (
            caName.includes("test")
        ) {
            throw new Error(
                "Production BankID cannot use the test Root CA"
            );
        }
    }
}


function getBankIdConfig() {
    const environment =
        getBankIdEnvironment();

    let baseUrl;
    let certPath;
    let passphrase;
    let caPath;

    if (environment === "production") {
        baseUrl =
            requireEnv(
                "BANKID_PROD_BASE_URL"
            );

        certPath =
            requireEnv(
                "BANKID_PROD_CERT_PATH"
            );

        passphrase =
            requireEnv(
                "BANKID_PROD_CERT_PASSPHRASE"
            );

        caPath =
            requireEnv(
                "BANKID_PROD_CA_PATH"
            );

    } else {
        baseUrl =
            requireEnv(
                "BANKID_BASE_URL"
            );

        certPath =
            requireEnv(
                "BANKID_CERT_PATH"
            );

        passphrase =
            requireEnv(
                "BANKID_CERT_PASSPHRASE"
            );

        caPath =
            requireEnv(
                "BANKID_CA_PATH"
            );
    }

    const resolvedCertPath =
        resolveBackendPath(certPath);

    const resolvedCaPath =
        resolveBackendPath(caPath);

    if (
        !fs.existsSync(
            resolvedCertPath
        )
    ) {
        throw new Error(
            `BankID certificate not found: ${resolvedCertPath}`
        );
    }

    if (
        !fs.existsSync(
            resolvedCaPath
        )
    ) {
        throw new Error(
            `BankID CA certificate not found: ${resolvedCaPath}`
        );
    }


    validateBankIdConfig({
    environment,
    baseUrl,
    certPath:
        resolvedCertPath,
    caPath:
        resolvedCaPath
});

    return {
        environment,

        baseUrl:
            baseUrl.replace(
                /\/+$/,
                ""
            ),

        certPath:
            resolvedCertPath,

        caPath:
            resolvedCaPath,

        passphrase
    };
}


function createBankIdAgent() {
    const config =
        getBankIdConfig();

    return new https.Agent({
        pfx:
            fs.readFileSync(
                config.certPath
            ),

        passphrase:
            config.passphrase,

        ca: [
            fs.readFileSync(
                config.caPath
            )
        ],

        rejectUnauthorized: true,

        keepAlive: true
    });
}


function bankIdRequest(
    endpoint,
    body
) {
    const config =
        getBankIdConfig();

    const url =
        new URL(
            `${config.baseUrl}/${endpoint}`
        );

    const payload =
        JSON.stringify(body);

    const agent =
        createBankIdAgent();

    return new Promise(
        (resolve, reject) => {

            const request =
                https.request(
                    {
                        protocol:
                            url.protocol,

                        hostname:
                            url.hostname,

                        port:
                            url.port || 443,

                        path:
                            url.pathname,

                        method:
                            "POST",

                        agent,

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json",

                            "Content-Length":
                                Buffer.byteLength(
                                    payload
                                )
                        }
                    },

                    (response) => {
                        let responseBody =
                            "";

                        response.setEncoding(
                            "utf8"
                        );

                        response.on(
                            "data",
                            (chunk) => {
                                responseBody +=
                                    chunk;
                            }
                        );

                        response.on(
                            "end",
                            () => {
                                let data = {};

                                try {
                                    data =
                                        responseBody
                                            ? JSON.parse(
                                                responseBody
                                            )
                                            : {};

                                } catch {
                                    const error =
                                        new Error(
                                            "BankID returned an invalid response."
                                        );

                                    error.statusCode =
                                        response.statusCode;

                                    return reject(
                                        error
                                    );
                                }

                                if (
                                    response.statusCode <
                                        200 ||
                                    response.statusCode >=
                                        300
                                ) {
                                    const error =
                                        new Error(
                                            data.details ||
                                            data.errorCode ||
                                            `BankID HTTP ${response.statusCode}`
                                        );

                                    error.statusCode =
                                        response.statusCode;

                                    error.bankId =
                                        data;

                                    return reject(
                                        error
                                    );
                                }

                                resolve(data);
                            }
                        );
                    }
                );

            request.on(
                "error",
                reject
            );

            request.write(
                payload
            );

            request.end();
        }
    );
}


function encodeBankIdText(text) {
    return Buffer
        .from(
            String(text),
            "utf8"
        )
        .toString(
            "base64"
        );
}


async function startSign({
    endUserIp,
    visibleText,
    nonVisibleText = null,
    returnUrl = null
}) {
    if (!endUserIp) {
        throw new Error(
            "endUserIp is required"
        );
    }

    if (!visibleText) {
        throw new Error(
            "visibleText is required"
        );
    }

    const body = {
        endUserIp,

        userVisibleData:
            encodeBankIdText(
                visibleText
            )
    };

    if (nonVisibleText) {
        body.userNonVisibleData =
            encodeBankIdText(
                nonVisibleText
            );
    }

    if (returnUrl) {
        body.returnUrl =
            returnUrl;
    }

    return bankIdRequest(
        "sign",
        body
    );
}


async function collectSign(
    orderRef
) {
    if (!orderRef) {
        throw new Error(
            "orderRef is required"
        );
    }

    return bankIdRequest(
        "collect",
        {
            orderRef
        }
    );
}


function getBankIdEnvironmentInfo() {
    const config =
        getBankIdConfig();

    return {
        environment:
            config.environment,

        baseUrl:
            config.baseUrl,

        certificate:
            path.basename(
                config.certPath
            ),

        caCertificate:
            path.basename(
                config.caPath
            )
    };
}


module.exports = {
    startSign,
    collectSign,
    encodeBankIdText,
    getBankIdEnvironmentInfo
};
