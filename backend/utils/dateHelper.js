function formatDate(date = new Date()) {

    return date.toLocaleDateString("sv-SE");

}

function addDays(days) {

    const date = new Date();

    date.setDate(date.getDate() + days);

    return formatDate(date);

}

module.exports = {

    formatDate,

    addDays

};