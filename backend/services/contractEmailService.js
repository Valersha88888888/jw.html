const transporter =
    require("../config/mailConfig");

function getCustomerName(contract) {
    return [
        contract.customer_first_name,
        contract.customer_last_name
    ]
        .filter(Boolean)
        .join(" ");
}

function getManagerEmail() {
    return (
        process.env.ADMIN_EMAIL ||
        process.env.EMAIL_USER
    );
}

async function sendContractEmail(
    contract,
    publicUrl
) {
    const customerName =
        getCustomerName(contract);

    return transporter.sendMail({
        from:
            `"J&W Quality Hemservice" <${process.env.EMAIL_USER}>`,

        to:
            contract.customer_email,

        subject:
            `Ditt avtal med J&W Quality Hemservice – ${contract.contract_number}`,

        html: `
            <div style="
                font-family:Arial,Helvetica,sans-serif;
                max-width:620px;
                margin:0 auto;
                color:#202431;
                line-height:1.6;
            ">
                <div style="
                    border-bottom:2px solid #ef8eae;
                    padding-bottom:18px;
                    margin-bottom:24px;
                ">
                    <h1 style="
                        margin:0;
                        font-size:25px;
                    ">
                        J&W Quality Hemservice
                    </h1>
                </div>

                <h2>
                    Ditt avtal är klart för granskning
                </h2>

                <p>
                    Hej ${customerName},
                </p>

                <p>
                    Ditt avtal om återkommande hemstädning
                    är nu klart.
                </p>

                <p>
                    Läs hela avtalet och kontrollera dina
                    uppgifter innan du fortsätter till
                    elektronisk signering.
                </p>

                <div style="
                    background:#fff5f8;
                    border:1px solid #f3c4d3;
                    border-radius:12px;
                    padding:18px;
                    margin:24px 0;
                ">
                    <strong>Viktiga villkor</strong>

                    <p style="margin-bottom:0">
                        149 kr/timme efter preliminärt RUT-avdrag
                        för de första 3 städtillfällena.<br>

                        250 kr/timme från och med städtillfälle 4.<br>

                        Bindningstid: 12 månader.<br>

                        Därefter: 30 dagars uppsägningstid.<br>

                        Ombokning/avbokning: senast 24 timmar
                        enligt avtalsvillkoren.
                    </p>
                </div>

                <p style="margin:30px 0">
                    <a
                        href="${publicUrl}"
                        style="
                            display:inline-block;
                            background:#ef7fa4;
                            color:#ffffff;
                            text-decoration:none;
                            padding:14px 24px;
                            border-radius:9px;
                            font-weight:bold;
                        "
                    >
                        Läs och signera avtalet
                    </a>
                </p>

                <p>
                    Avtalsnummer:
                    <strong>${contract.contract_number}</strong>
                </p>

                <p>
                    Med vänliga hälsningar<br>
                    <strong>J&W Quality Hemservice</strong>
                </p>
            </div>
        `
    });
}

async function sendContractOtpEmail(
    contract,
    otpCode
) {
    const customerName =
        getCustomerName(contract);

    return transporter.sendMail({
        from:
            `"J&W Quality Hemservice" <${process.env.EMAIL_USER}>`,

        to:
            contract.customer_email,

        subject:
            `Verifieringskod för ditt avtal – ${contract.contract_number}`,

        html: `
            <div style="
                font-family:Arial,Helvetica,sans-serif;
                max-width:620px;
                margin:0 auto;
                color:#202431;
                line-height:1.6;
            ">
                <h2>
                    Verifiera din signering
                </h2>

                <p>
                    Hej ${customerName},
                </p>

                <p>
                    Du har begärt en verifieringskod för att
                    signera ditt avtal med
                    <strong>J&W Quality Hemservice</strong>.
                </p>

                <div style="
                    margin:28px 0;
                    padding:22px;
                    text-align:center;
                    background:#fff5f8;
                    border:1px solid #f3c4d3;
                    border-radius:12px;
                ">
                    <div style="
                        font-size:14px;
                        margin-bottom:8px;
                    ">
                        Din verifieringskod
                    </div>

                    <strong style="
                        font-size:34px;
                        letter-spacing:8px;
                    ">
                        ${otpCode}
                    </strong>
                </div>

                <p>
                    Koden gäller i 10 minuter.
                </p>

                <p>
                    Lämna aldrig koden till någon annan.
                    Om du inte själv begärde koden kan du
                    ignorera detta meddelande.
                </p>

                <p>
                    Avtalsnummer:
                    <strong>${contract.contract_number}</strong>
                </p>

                <p>
                    Med vänliga hälsningar<br>
                    <strong>J&W Quality Hemservice</strong>
                </p>
            </div>
        `
    });
}

async function sendSignedContractEmail(
    contract,
    pdfPath
) {
    const customerName =
        getCustomerName(contract);

    return transporter.sendMail({
        from:
            `"J&W Quality Hemservice" <${process.env.EMAIL_USER}>`,

        to:
            contract.customer_email,

        subject:
            `Ditt signerade avtal – ${contract.contract_number}`,

        html: `
            <div style="
                font-family:Arial,Helvetica,sans-serif;
                max-width:620px;
                margin:0 auto;
                color:#202431;
                line-height:1.6;
            ">
                <h2>
                    Ditt avtal är signerat
                </h2>

                <p>
                    Hej ${customerName},
                </p>

                <p>
                    Tack. Ditt avtal med
                    <strong>J&W Quality Hemservice</strong>
                    har signerats elektroniskt.
                </p>

                <p>
                    Signeringen har registrerats tillsammans
                    med verifierings- och signeringsbevis.
                </p>

                <p>
                    En kopia av det signerade avtalet
                    finns bifogad som PDF.
                </p>

                <p>
                    Avtalsnummer:
                    <strong>${contract.contract_number}</strong>
                </p>

                <p>
                    Med vänliga hälsningar<br>
                    <strong>J&W Quality Hemservice</strong>
                </p>
            </div>
        `,

        attachments: [
            {
                filename:
                    `${contract.contract_number}-signed.pdf`,

                path:
                    pdfPath
            }
        ]
    });
}

async function sendManagerSignedContractEmail(
    contract,
    pdfPath
) {
    const managerEmail =
        getManagerEmail();

    if (!managerEmail) {
        throw new Error(
            "Manager email is not configured"
        );
    }

    const customerName =
        getCustomerName(contract);

    return transporter.sendMail({
        from:
            `"J&W Quality Hemservice CRM" <${process.env.EMAIL_USER}>`,

        to:
            managerEmail,

        subject:
            `Avtal signerat – ${contract.contract_number}`,

        html: `
            <div style="
                font-family:Arial,Helvetica,sans-serif;
                max-width:620px;
                margin:0 auto;
                color:#202431;
                line-height:1.6;
            ">
                <h2>
                    Ett kundavtal har signerats
                </h2>

                <p>
                    Kunden
                    <strong>${customerName}</strong>
                    har signerat sitt avtal elektroniskt.
                </p>

                <p>
                    Avtalsnummer:
                    <strong>${contract.contract_number}</strong>
                </p>

                <p>
                    Det signerade avtalet finns bifogat
                    som PDF.
                </p>
            </div>
        `,

        attachments: [
            {
                filename:
                    `${contract.contract_number}-signed.pdf`,

                path:
                    pdfPath
            }
        ]
    });
}

module.exports = {
    sendContractEmail,
    sendContractOtpEmail,
    sendSignedContractEmail,
    sendManagerSignedContractEmail
};