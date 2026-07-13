const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function getAdminConfig() {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL;
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    if (!name || !email || !passwordHash || !jwtSecret) {
        throw new Error("Admin authentication is not configured");
    }

    return {
        name,
        email: email.trim().toLowerCase(),
        passwordHash,
        jwtSecret
    };
}

async function login(email, password) {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    const admin = getAdminConfig();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail !== admin.email) {
        throw new Error("Invalid credentials");
    }

    const validPassword = await bcrypt.compare(
        password,
        admin.passwordHash
    );

    if (!validPassword) {
        throw new Error("Invalid credentials");
    }

    const user = {
        id: "admin",
        name: admin.name,
        email: admin.email,
        role: "admin"
    };

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        admin.jwtSecret,
        {
            expiresIn: "7d"
        }
    );

    return {
        token,
        user
    };
}

module.exports = {
    login
};
