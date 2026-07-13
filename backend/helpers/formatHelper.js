function formatDate(date = new Date()) {

    return new Intl.DateTimeFormat("sv-SE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(date);

}

function formatPrice(price) {

    return new Intl.NumberFormat("sv-SE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);

}

function calculateVAT(price) {

    return Number(price) * 0.25;

}

function calculateTotal(price) {

    return Number(price) * 1.25;

}

module.exports = {
    formatDate,
    formatPrice,
    calculateVAT,
    calculateTotal
};