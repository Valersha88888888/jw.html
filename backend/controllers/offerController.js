const path = require("path");

const {
    generateOfferPDF,
    getOffers,
    createOffer
} = require("../services/offerService");

const { sendOfferEmail } = require("../services/emailService");
const { sendOfferSMS } = require("../services/smsService");
const { generateOfferNumber } = require("../utils/offerNumber");
const log = require("../services/logService");

async function generateOffer(req, res) {

    try {

        const customer = req.body;

        customer.offerNumber = generateOfferNumber();

        customer.pdfPath = path.join(
            __dirname,
            "../offers",
            `${customer.offerNumber}.pdf`
        );

        await generateOfferPDF(customer, customer.pdfPath);

        createOffer(customer);



        log.info(
            `Offer generated: ${customer.offerNumber}`
        );

        await sendOfferEmail(customer);

        log.info(
            `Offer email sent: ${customer.email}`
        );

        await sendOfferSMS(customer);

        if (customer.phone) {

            log.info(
                `SMS sent: ${customer.phone}`
            );

        }

        res.json({

            success: true,
            offerNumber: customer.offerNumber

        });

    } catch (error) {

        log.error(
            `Offer failed: ${error.message}`
        );

        console.error(error);

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

}

function getAllOffers(req, res) {

    try {

        res.json(getOffers());

    }

    catch(error){

        res.status(500).json({

            success:false,
            message:error.message

        });

    }

}
module.exports = {

    generateOffer,
    getOffers: getAllOffers

};
