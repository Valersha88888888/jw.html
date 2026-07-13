function formatCurrency(value) {

    return new Intl.NumberFormat(

        "sv-SE",

        {

            style: "currency",

            currency: "SEK"

        }

    ).format(value);

}

module.exports = {

    formatCurrency

};