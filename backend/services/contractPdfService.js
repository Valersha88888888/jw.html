const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const puppeteer = require("puppeteer");

const {
    buildSignedContractTemplate
} = require(
    "../templates/signedContractTemplate"
);


async function generateSignedContractPDF(contract) {

    if (!contract) {
        throw new Error(
            "Contract data is required for PDF generation."
        );
    }

    if (!contract.contract_number) {
        throw new Error(
            "Contract number is missing."
        );
    }


    const outputDir =
        path.join(
            __dirname,
            "../generated/contracts"
        );


    await fs.promises.mkdir(
        outputDir,
        {
            recursive: true
        }
    );


    const safeContractNumber =
        String(
            contract.contract_number
        )
            .trim()
            .replace(
                /[^a-zA-Z0-9_-]/g,
                "_"
            );


    const outputPath =
        path.join(
            outputDir,
            `${safeContractNumber}-signed.pdf`
        );


    const html =
        buildSignedContractTemplate(
            contract
        );


    let browser = null;


    try {

        browser =
            await puppeteer.launch({
                headless: true,

                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox"
                ]
            });


        const page =
            await browser.newPage();


        await page.setViewport({
            width: 1240,
            height: 1754,
            deviceScaleFactor: 1
        });


        await page.setContent(
            html,
            {
                waitUntil: "networkidle0"
            }
        );


        await page.emulateMediaType(
            "print"
        );


        await page.evaluate(
            async () => {
                if (
                    document.fonts &&
                    document.fonts.ready
                ) {
                    await document.fonts.ready;
                }
            }
        );


        await page.pdf({
            path: outputPath,

            format: "A4",

            printBackground: true,

            preferCSSPageSize: true,

            displayHeaderFooter: false,

            margin: {
                top: "0",
                right: "0",
                bottom: "0",
                left: "0"
            }
        });


    } finally {

        if (browser) {
            await browser.close();
        }

    }


    const pdfBuffer =
        await fs.promises.readFile(
            outputPath
        );


    const pdfHash =
        crypto
            .createHash("sha256")
            .update(pdfBuffer)
            .digest("hex");


    return {
        outputPath,
        pdfHash
    };
}


module.exports = {
    generateSignedContractPDF
};
