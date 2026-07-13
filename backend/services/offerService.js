const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const puppeteer = require("puppeteer");

const OFFERS_FILE = path.join(__dirname, "../offers.json");

function getOffers() {
    if (!fs.existsSync(OFFERS_FILE)) {
        fs.writeFileSync(OFFERS_FILE, "[]");
    }

    const data = fs.readFileSync(OFFERS_FILE, "utf8");

    if (!data.trim()) {
        return [];
    }

    return JSON.parse(data);
}

function saveOffers(offers) {
    fs.writeFileSync(
        OFFERS_FILE,
        JSON.stringify(offers, null, 2)
    );
}

function createOffer(data) {
    const offers = getOffers();

    const offer = {
        id: Date.now(),
        ...data,
        createdAt: new Date().toISOString()
    };

    offers.push(offer);
    saveOffers(offers);

    return offer;
}

async function generateOfferPDF(data, outputPath) {
    const templatePath = path.join(
        __dirname,
        "../templates/offer.html"
    );

    const html = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(html);
    const finalHtml = template(data);

    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();

    await page.setContent(finalHtml, {
        waitUntil: "networkidle0"
    });

    await page.pdf({
        path: outputPath,
        format: "A4",
        printBackground: true
    });

    await browser.close();

    return outputPath;
}

module.exports = {
    getOffers,
    saveOffers,
    createOffer,
    generateOfferPDF
};