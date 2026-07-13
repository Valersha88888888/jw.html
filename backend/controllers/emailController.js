const transporter = require("../config/mailConfig");
const log = require("../services/logService");

async function sendEmail(req, res) {

    try {

        const {

            to,
            subject,
            message

        } = req.body;

        await transporter.sendMail({

            from: `"J&W Quality Hemservice" <${process.env.EMAIL_USER}>`,

            to,

            subject,

            html: `
                <div style="font-family:Arial;padding:25px;max-width:700px;">

                    <h2 style="color:#d97ac6;">
                        J&W Quality Hemservice
                    </h2>

                    <p>
                        ${message.replace(/\n/g, "<br>")}
                    </p>

                    <hr>

                    <p>
                        Med vänliga hälsningar
                    </p>

                    <strong>
                        J&W Quality Hemservice
                    </strong>

                    <br>

                    📞 ${process.env.COMPANY_PHONE}

                    <br>

                    📧 ${process.env.EMAIL_USER}

                </div>
            `

        });

        log.info(
            `Email sent: ${to}`
        );

        res.json({

            success: true

        });

    } catch (err) {

        log.error(
            `Email failed: ${err.message}`
        );

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

}

module.exports = {

    sendEmail

};