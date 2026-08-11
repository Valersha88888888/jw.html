const API_URL = "/api";

const params =
    new URLSearchParams(
        window.location.search
    );

const token =
    params.get("token");

const loading =
    document.getElementById(
        "contractLoading"
    );

const errorBox =
    document.getElementById(
        "contractError"
    );

const content =
    document.getElementById(
        "contractContent"
    );

const bankIdButton =
    document.getElementById(
        "bankIdButton"
    );

const bankIdMessage =
    document.getElementById(
        "bankIdMessage"
    );

const confirmations = [
    "confirmRead",
    "confirmBinding",
    "confirmPrice",
    "confirmCancellation",
    "confirmWithdrawal"
].map(
    (id) =>
        document.getElementById(id)
);

function updateBankIdButton() {
    const allChecked =
        confirmations.every(
            (checkbox) =>
                checkbox.checked
        );

    bankIdButton.disabled =
        !allChecked;

    bankIdMessage.textContent =
        allChecked
            ? "Du kan nu fortsätta till säker signering med BankID."
            : "Bekräfta samtliga punkter ovan för att fortsätta.";
}

confirmations.forEach(
    (checkbox) => {
        checkbox.addEventListener(
            "change",
            updateBankIdButton
        );
    }
);

async function loadContract() {
    if (!token) {
        showError(
            "Avtalslänken är ogiltig."
        );

        return;
    }

    try {
        const response =
            await fetch(
                `${API_URL}/public/contracts/${encodeURIComponent(token)}`
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Avtalet kunde inte laddas."
            );
        }

        const contract =
            data.contract;

        document.getElementById(
            "contractNumber"
        ).textContent =
            `Avtal ${contract.contractNumber}`;

        document.getElementById(
            "documentNumber"
        ).textContent =
            contract.contractNumber;

        document.getElementById(
            "customerGreeting"
        ).textContent =
            `Hej ${contract.customerName}!`;

        document.getElementById(
            "legalContract"
        ).innerHTML =
            contract.contractHtml;

        loading.hidden = true;
        content.hidden = false;

        if (contract.status === "signed") {
            bankIdButton.disabled = true;

            bankIdButton.textContent =
                "Avtalet är redan signerat";

            bankIdMessage.textContent =
                "Detta avtal har redan signerats med BankID.";

            confirmations.forEach(
                (checkbox) => {
                    checkbox.disabled = true;
                    checkbox.checked = true;
                }
            );
        }

    } catch (error) {
        showError(error.message);
    }
}

function showError(message) {
    loading.hidden = true;

    errorBox.hidden = false;
    errorBox.textContent = message;
}

const bankIdSigning =
    document.getElementById(
        "bankIdSigning"
    );

const bankIdStatus =
    document.getElementById(
        "bankIdStatus"
    );

const bankIdQrContainer =
    document.getElementById(
        "bankIdQrContainer"
    );

const bankIdQrImage =
    document.getElementById(
        "bankIdQrImage"
    );

const bankIdOpenApp =
    document.getElementById(
        "bankIdOpenApp"
    );

const bankIdSameDevice =
    document.getElementById(
        "bankIdSameDevice"
    );

const bankIdOtherDevice =
    document.getElementById(
        "bankIdOtherDevice"
    );

let bankIdCollectTimer = null;
let bankIdQrTimer = null;
let bankIdRunning = false;

function getBankIdHintMessage(hintCode) {
    const messages = {
        outstandingTransaction:
            "Starta BankID-appen och identifiera dig.",

        noClient:
            "Starta BankID-appen.",

        started:
            "Skriv in din säkerhetskod i BankID-appen.",

        userSign:
            "Bekräfta och signera i BankID-appen.",

        userCancel:
            "Signeringen avbröts i BankID.",

        cancelled:
            "BankID-signeringen avbröts.",

        expiredTransaction:
            "BankID-signeringen tog för lång tid. Försök igen.",

        startFailed:
            "BankID kunde inte startas. Försök igen."
    };

    return (
        messages[hintCode] ||
        "Väntar på BankID..."
    );
}

function stopBankIdTimers() {
    if (bankIdCollectTimer) {
        clearInterval(bankIdCollectTimer);
        bankIdCollectTimer = null;
    }

    if (bankIdQrTimer) {
        clearInterval(bankIdQrTimer);
        bankIdQrTimer = null;
    }
}

async function updateBankIdQr() {
    try {
        const response =
            await fetch(
                `${API_URL}/public/contracts/${encodeURIComponent(token)}/bankid/qr`
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "QR-koden kunde inte uppdateras."
            );
        }

        if (data.qrImage) {
            bankIdQrImage.src =
                data.qrImage;

            bankIdQrContainer.hidden =
                false;
        }

    } catch (error) {
        console.error(
            "BankID QR:",
            error
        );
    }
}

async function collectBankId() {
    if (!bankIdRunning) {
        return;
    }

    try {
        const response =
            await fetch(
                `${API_URL}/public/contracts/${encodeURIComponent(token)}/bankid/collect`,
                {
                    method: "POST"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "BankID-status kunde inte hämtas."
            );
        }

        if (data.status === "pending") {
            bankIdStatus.textContent =
                getBankIdHintMessage(
                    data.hintCode
                );

            return;
        }

        if (data.status === "complete") {
            bankIdRunning = false;

            stopBankIdTimers();

            bankIdStatus.textContent =
                "Avtalet är signerat med BankID.";

            bankIdMessage.textContent =
                "Tack! Din signering är registrerad.";

            bankIdButton.disabled = true;

            bankIdButton.textContent =
                "Avtalet är signerat";

            bankIdQrContainer.hidden =
                true;

            bankIdOpenApp.hidden =
                true;

            confirmations.forEach(
                (checkbox) => {
                    checkbox.checked = true;
                    checkbox.disabled = true;
                }
            );

            return;
        }

        if (data.status === "failed") {
            bankIdRunning = false;

            stopBankIdTimers();

            bankIdStatus.textContent =
                getBankIdHintMessage(
                    data.hintCode
                );

            bankIdQrContainer.hidden =
                true;

            bankIdOpenApp.hidden =
                true;

            bankIdButton.disabled =
                false;

            bankIdButton.textContent =
                "Försök signera med BankID igen";
        }

    } catch (error) {
        bankIdRunning = false;

        stopBankIdTimers();

        bankIdStatus.textContent =
            error.message;

        bankIdButton.disabled =
            false;

        bankIdButton.textContent =
            "Försök signera med BankID igen";
    }
}

function isMobileOrTabletDevice() {
    const userAgent =
        navigator.userAgent || "";

    const touchDevice =
        navigator.maxTouchPoints > 1;

    const mobileUserAgent =
        /Android|iPhone|iPad|iPod/i.test(
            userAgent
        );

    const iPadDesktopMode =
        navigator.platform === "MacIntel" &&
        touchDevice;

    return (
        mobileUserAgent ||
        iPadDesktopMode
    );
}


async function startBankId() {
    if (bankIdRunning) {
        return;
    }

    bankIdRunning = true;

    stopBankIdTimers();

    bankIdButton.disabled = true;

    bankIdButton.textContent =
        "BankID-signering pågår...";

    bankIdMessage.textContent =
        "BankID-signeringen har startats.";

    bankIdSigning.hidden = false;

    bankIdSameDevice.hidden = true;
    bankIdOtherDevice.hidden = true;
    bankIdOpenApp.hidden = true;
    bankIdQrContainer.hidden = true;

    bankIdStatus.textContent =
        "Startar en säker BankID-signering...";

    try {
        const response =
            await fetch(
                `${API_URL}/public/contracts/${encodeURIComponent(token)}/bankid/start`,
                {
                    method: "POST",
                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "BankID kunde inte startas."
            );
        }

        const sameDevice =
            isMobileOrTabletDevice();

        if (sameDevice) {
            bankIdSameDevice.hidden =
                false;

            bankIdOtherDevice.hidden =
                true;

            bankIdStatus.textContent =
                "Öppna BankID-appen på den här enheten.";

            if (
                data.bankId &&
                data.bankId.autoStartToken
            ) {
                bankIdOpenApp.href =
                    `https://app.bankid.com/?autostarttoken=${encodeURIComponent(
                        data.bankId.autoStartToken
                    )}`;

                bankIdOpenApp.hidden =
                    false;
            }

        } else {
            bankIdSameDevice.hidden =
                true;

            bankIdOtherDevice.hidden =
                false;

            bankIdStatus.textContent =
                "Skanna den rörliga QR-koden med BankID-appen på mobilen.";

            await updateBankIdQr();

            bankIdQrTimer =
                setInterval(
                    updateBankIdQr,
                    1000
                );
        }

        await collectBankId();

        bankIdCollectTimer =
            setInterval(
                collectBankId,
                2000
            );

    } catch (error) {
        bankIdRunning = false;

        stopBankIdTimers();

        bankIdSameDevice.hidden =
            true;

        bankIdOtherDevice.hidden =
            true;

        bankIdOpenApp.hidden =
            true;

        bankIdQrContainer.hidden =
            true;

        bankIdStatus.textContent =
            error.message;

        bankIdMessage.textContent =
            "BankID-signeringen kunde inte startas.";

        bankIdButton.disabled =
            false;

        bankIdButton.textContent =
            "Försök signera med BankID igen";
    }
}
bankIdButton.addEventListener(
    "click",
    startBankId
);

loadContract();
