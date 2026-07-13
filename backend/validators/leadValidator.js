function validateLead(data) {

    const errors = [];

    if (!data.name) {

        errors.push("Namn saknas");

    }

    if (!data.email) {

        errors.push("E-post saknas");

    }

    if (!data.phone) {

        errors.push("Telefon saknas");

    }

    return {

        valid: errors.length === 0,

        errors

    };

}

module.exports = {

    validateLead

};