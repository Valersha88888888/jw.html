const { login } = require("./authService");

async function signIn(req, res) {
    try {
        const { email, password } = req.body;

        const result = await login(
            email,
            password
        );

        res.json({
            success: true,
            token: result.token,
            user: result.user
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    }
}

module.exports = {
    signIn
};
