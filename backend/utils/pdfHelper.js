const path = require("path");

function getOfferPath(offerNumber) {

    return path.join(

        __dirname,

        "../offers",

        `${offerNumber}.pdf`

    );

}

module.exports = {

    getOfferPath

};