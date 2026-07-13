const transporter = require("../config/mailConfig");

async function contact(req, res) {

    try {

        const {

            namn,
            email,
            telefon,
            tjanst,
            meddelande

        } = req.body;

        await transporter.sendMail({

            from: `"J&W Quality Hemservice" <${process.env.EMAIL_USER}>`,

            to: "jw.qualityhemservice@gmail.com",

             subject: `Ny kontaktfÃ¶rfrÃ¥gan frÃ¥n ${namn}`,
            html: `

                <h2>Ny kontaktfÃ¶rfrÃ¥gan</h2>

                <p><strong>Namn:</strong> ${namn}</p>

                <p><strong>E-post:</strong> ${email}</p>

                <p><strong>Telefon:</strong> ${telefon}</p>

                <p><strong>TjÃ¤nst:</strong> ${tjanst}</p>

                <p><strong>Meddelande:</strong></p>

                <p>${(meddelande || "").replace(/\n/g,"<br>")}</p>


            `

        });

        res.json({

            success: true,

            message: "Meddelandet skickades."

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Kunde inte skicka meddelandet."

        });

    }

}

module.exports = {

    contact

};
