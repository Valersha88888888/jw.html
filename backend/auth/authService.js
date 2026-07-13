const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const USERS_FILE = path.join(__dirname, "../users.json");

function getUsers() {

    try {

        const data = fs.readFileSync(USERS_FILE, "utf8");

        if (!data.trim()) {

            return [];

        }

        return JSON.parse(data);

    } catch {

        return [];

    }

}

function saveUsers(users) {

    fs.writeFileSync(

        USERS_FILE,

        JSON.stringify(users, null, 2)

    );

}

async function createAdmin(name, email, password) {

    const users = getUsers();

    const exists = users.find(

        user => user.email === email

    );

    if (exists) {

        throw new Error("User already exists");

    }

    const hash = await bcrypt.hash(password, 10);

    const user = {

        id: Date.now(),

        name,

        email,

        password: hash,

        role: "admin",

        createdAt: new Date().toISOString()

    };

    users.push(user);

    saveUsers(users);

    return user;

}

async function login(email, password) {

    const users = getUsers();

    const user = users.find(

        u => u.email === email

    );

    if (!user) {

        throw new Error("Invalid credentials");

    }

    const valid = await bcrypt.compare(

        password,

        user.password

    );

    if (!valid) {

        throw new Error("Invalid credentials");

    }

    const token = jwt.sign(

        {

            id: user.id,

            email: user.email,

            role: user.role

        },

        process.env.JWT_SECRET,

        {

            expiresIn: "7d"

        }

    );

    return {

        token,

        user: {

            id: user.id,

            name: user.name,

            email: user.email,

            role: user.role

        }

    };

}

module.exports = {

    createAdmin,

    login

};