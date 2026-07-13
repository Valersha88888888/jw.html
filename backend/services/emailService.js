const transporter = require("../config/mailConfig");

async function sendOfferEmail(customer) {

    return transporter.sendMail({

        from: `"J&W Quality Hemservice" <${process.env.EMAIL_USER}>`,

        to: customer.email,

        subject: `Offert ${customer.offerNumber}`,

        html: `
            <h2>Hej ${customer.name}!</h2>

            <p>Tack för att du kontaktade J&W Quality Hemservice.</p>

            <p>Din offert finns bifogad.</p>

            <p>Vi ser fram emot att hjälpa dig.</p>

            <br>

            <strong>J&W Quality Hemservice</strong>
        `,

        attachments: [
            {
                filename: `${customer.offerNumber}.pdf`,
                path: customer.pdfPath
            }
        ]

    });

}

module.exports = {
    sendOfferEmail
};