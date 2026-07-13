const {

    createAdmin,
    login

} = require("./authService");

async function register(req, res) {
    console.log("========== REGISTER ==========");
console.log("Headers:");
console.log(req.headers);

console.log("Body:");
console.log(req.body);

console.log("==============================");

    try {

        const {

            name,
            email,
            password

        } = req.body;

        const user = await createAdmin(

            name,
            email,
            password

        );

        res.json({

            success: true,
            user

        });

    } catch (error) {

        res.status(400).json({

            success: false,
            message: error.message

        });

    }

}



async function signIn(req, res) {

    try {

        const {

            email,
            password

        } = req.body;

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

            message: error.message

        });

    }

}

module.exports = {

    register,

    signIn

};