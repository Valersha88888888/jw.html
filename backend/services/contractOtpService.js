const crypto = require("crypto");
const bcrypt = require("bcrypt");

function generateOtpCode() {
    return String(
        crypto.randomInt(100000, 1000000)
    );
}

async function hashOtpCode(code) {
    return bcrypt.hash(code, 12);
}

async function verifyOtpCode(
    code,
    hash
) {
    if (!code || !hash) {
        return false;
    }

    return bcrypt.compare(
        String(code),
        hash
    );
}

function getOtpExpiryDate() {
    const expiresAt =
        new Date(
            Date.now() +
            10 * 60 * 1000
        );

    return expiresAt;
}

module.exports = {
    generateOtpCode,
    hashOtpCode,
    verifyOtpCode,
    getOtpExpiryDate
};