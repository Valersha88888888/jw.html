const API_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:3000/api"
        : "https://jw-quality-hemservice-crm.onrender.com/api";

const params =
    new URLSearchParams(
        window.location.search
    );

const token =
    params.get("token");


/*
 * =========================================================
 * DOM
 * =========================================================
 */

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

const contractNumber =
    document.getElementById(
        "contractNumber"
    );

const documentNumber =
    document.getElementById(
        "documentNumber"
    );

const customerGreeting =
    document.getElementById(
        "customerGreeting"
    );

const legalContract =
    document.getElementById(
        "legalContract"
    );


/*
 * =========================================================
 * AVTALSBEKRÄFTELSER
 * =========================================================
 */

const confirmationMap = {
    read:
        document.getElementById(
            "confirmRead"
        ),

    binding:
        document.getElementById(
            "confirmBinding"
        ),

    price:
        document.getElementById(
            "confirmPrice"
        ),

    cancellation:
        document.getElementById(
            "confirmCancellation"
        ),

    withdrawal:
        document.getElementById(
            "confirmWithdrawal"
        )
};

const confirmations =
    Object.values(
        confirmationMap
    );


/*
 * =========================================================
 * OTP
 * =========================================================
 */

const requestOtpButton =
    document.getElementById(
        "requestOtpButton"
    );

const otpRequestMessage =
    document.getElementById(
        "otpRequestMessage"
    );

const otpVerifyArea =
    document.getElementById(
        "otpVerifyArea"
    );

const otpCode =
    document.getElementById(
        "otpCode"
    );

const verifyOtpButton =
    document.getElementById(
        "verifyOtpButton"
    );

const otpVerifyMessage =
    document.getElementById(
        "otpVerifyMessage"
    );


/*
 * =========================================================
 * SIGNERARE
 * =========================================================
 */

const signerStep =
    document.getElementById(
        "signerStep"
    );

const signerName =
    document.getElementById(
        "signerName"
    );


/*
 * =========================================================
 * SIGNATUR
 * =========================================================
 */

const signatureStep =
    document.getElementById(
        "signatureStep"
    );

const signatureCanvas =
    document.getElementById(
        "signatureCanvas"
    );

const clearSignatureButton =
    document.getElementById(
        "clearSignatureButton"
    );

const signatureMessage =
    document.getElementById(
        "signatureMessage"
    );


/*
 * =========================================================
 * SLUTLIG SIGNERING
 * =========================================================
 */

const finalSigningStep =
    document.getElementById(
        "finalSigningStep"
    );

const confirmElectronicSignature =
    document.getElementById(
        "confirmElectronicSignature"
    );

const signContractButton =
    document.getElementById(
        "signContractButton"
    );

const signingStatus =
    document.getElementById(
        "signingStatus"
    );

const signingSuccess =
    document.getElementById(
        "signingSuccess"
    );


/*
 * =========================================================
 * STATE
 * =========================================================
 */

let currentContract =
    null;

let otpVerified =
    false;

let otpRequestRunning =
    false;

let otpVerifyRunning =
    false;

let signingRunning =
    false;

let signatureStarted =
    false;

let signatureHasContent =
    false;

let drawing =
    false;

let lastPoint =
    null;

let resendTimer =
    null;


/*
 * =========================================================
 * HJÄLPFUNKTIONER
 * =========================================================
 */

function allConfirmationsChecked() {
    return confirmations.every(
        (checkbox) =>
            checkbox &&
            checkbox.checked
    );
}


function setConfirmationsDisabled(
    disabled
) {
    confirmations.forEach(
        (checkbox) => {
            if (checkbox) {
                checkbox.disabled =
                    disabled;
            }
        }
    );
}


function getConsentData() {
    return {
        read:
            Boolean(
                confirmationMap.read
                    ?.checked
            ),

        binding:
            Boolean(
                confirmationMap.binding
                    ?.checked
            ),

        price:
            Boolean(
                confirmationMap.price
                    ?.checked
            ),

        cancellation:
            Boolean(
                confirmationMap.cancellation
                    ?.checked
            ),

        withdrawal:
            Boolean(
                confirmationMap.withdrawal
                    ?.checked
            )
    };
}


function showError(message) {
    loading.hidden =
        true;

    content.hidden =
        true;

    errorBox.hidden =
        false;

    errorBox.textContent =
        message;
}


function showContent() {
    loading.hidden =
        true;

    errorBox.hidden =
        true;

    content.hidden =
        false;
}


async function readJsonResponse(
    response
) {
    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        contentType.includes(
            "application/json"
        )
    ) {
        return response.json();
    }

    const text =
        await response.text();

    return {
        success:
            false,

        message:
            text ||
            "Ett oväntat serverfel inträffade."
    };
}


/*
 * =========================================================
 * KONTROLL AV SIGNERINGSFLÖDET
 * =========================================================
 */

function updateOtpRequestState() {
    if (
        !requestOtpButton ||
        otpVerified
    ) {
        return;
    }

    const ready =
        allConfirmationsChecked();

    requestOtpButton.disabled =
        !ready ||
        otpRequestRunning;

    if (!ready) {
        otpRequestMessage.textContent =
            "Bekräfta samtliga punkter ovan för att fortsätta.";
    } else if (
        !otpRequestRunning
    ) {
        otpRequestMessage.textContent =
            "Du kan nu verifiera din e-post och fortsätta till signeringen.";
    }
}


function updateFinalSigningState() {
    if (!signContractButton) {
        return;
    }

    const nameValid =
        Boolean(
            signerName &&
            signerName.value
                .trim()
                .length >= 2
        );

    const finalConsent =
        Boolean(
            confirmElectronicSignature
                ?.checked
        );

    signContractButton.disabled =
        !otpVerified ||
        !allConfirmationsChecked() ||
        !nameValid ||
        !signatureHasContent ||
        !finalConsent ||
        signingRunning;
}


function showVerifiedSigningSteps() {
    otpVerified =
        true;

    if (otpVerifyArea) {
        otpVerifyArea.hidden =
            false;
    }

    if (otpCode) {
        otpCode.disabled =
            true;
    }

    if (verifyOtpButton) {
        verifyOtpButton.disabled =
            true;

        verifyOtpButton.textContent =
            "E-post verifierad";
    }

    if (requestOtpButton) {
        requestOtpButton.disabled =
            true;

        requestOtpButton.textContent =
            "E-post verifierad";
    }

    if (otpRequestMessage) {
        otpRequestMessage.textContent =
            "Din e-postadress är verifierad.";
    }

    if (otpVerifyMessage) {
        otpVerifyMessage.textContent =
            "Verifieringen lyckades. Du kan nu slutföra signeringen.";
    }

    signerStep.hidden =
        false;

    signatureStep.hidden =
        false;

    finalSigningStep.hidden =
        false;

    updateFinalSigningState();
}


/*
 * =========================================================
 * LADDA AVTAL
 * =========================================================
 */

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
                `${API_URL}/public/contracts/${encodeURIComponent(
                    token
                )}`,
                {
                    method:
                        "GET",

                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );

        const data =
            await readJsonResponse(
                response
            );

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Avtalet kunde inte laddas."
            );
        }

        currentContract =
            data.contract;

        contractNumber.textContent =
            `Avtal ${currentContract.contractNumber}`;

        documentNumber.textContent =
            currentContract.contractNumber;

        customerGreeting.textContent =
            `Hej ${currentContract.customerName}!`;

        legalContract.innerHTML =
            currentContract.contractHtml;

        if (
            signerName &&
            currentContract.customerName
        ) {
            signerName.value =
                currentContract.customerName;
        }

        showContent();

        if (
            currentContract.status ===
            "signed"
        ) {
            showAlreadySignedState();
            return;
        }

        if (
            currentContract.otpVerified
        ) {
            setConfirmationsDisabled(
                true
            );

            confirmations.forEach(
                (checkbox) => {
                    if (checkbox) {
                        checkbox.checked =
                            true;
                    }
                }
            );

            showVerifiedSigningSteps();
        } else {
            updateOtpRequestState();
        }

        resizeSignatureCanvas();

    } catch (error) {
        showError(
            error.message ||
            "Avtalet kunde inte laddas."
        );
    }
}


/*
 * =========================================================
 * REDAN SIGNERAT
 * =========================================================
 */

function showAlreadySignedState() {
    setConfirmationsDisabled(
        true
    );

    confirmations.forEach(
        (checkbox) => {
            if (checkbox) {
                checkbox.checked =
                    true;
            }
        }
    );

    requestOtpButton.disabled =
        true;

    requestOtpButton.textContent =
        "Avtalet är redan signerat";

    otpRequestMessage.textContent =
        "Detta avtal har redan signerats elektroniskt.";

    signerStep.hidden =
        true;

    signatureStep.hidden =
        true;

    finalSigningStep.hidden =
        true;

    signingSuccess.hidden =
        false;
}


/*
 * =========================================================
 * OTP - BEGÄR KOD
 * =========================================================
 */

async function requestOtp() {
    if (
        otpRequestRunning ||
        otpVerified ||
        !allConfirmationsChecked()
    ) {
        return;
    }

    otpRequestRunning =
        true;

    requestOtpButton.disabled =
        true;

    requestOtpButton.textContent =
        "Skickar kod...";

    otpRequestMessage.textContent =
        "Vi skickar nu din verifieringskod. Kontrollera din e-post.";

    try {
        const response =
            await fetch(
                `${API_URL}/public/contracts/${encodeURIComponent(
                    token
                )}/otp/request`,
                {
                    method:
                        "POST",

                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );

        const data =
            await readJsonResponse(
                response
            );

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Verifieringskoden kunde inte skickas."
            );
        }

        otpVerifyArea.hidden =
            false;

        otpRequestMessage.textContent =
            "Koden har skickats. Kontrollera din e-post och ange den sexsiffriga koden nedan. Koden gäller i 10 minuter.";

        otpCode.disabled =
            false;

        otpCode.value =
            "";

        otpCode.focus();

        startResendCooldown();

    } catch (error) {
        requestOtpButton.disabled =
            false;

        requestOtpButton.textContent =
            "Skicka verifieringskod";

        otpRequestMessage.textContent =
            error.message ||
            "Verifieringskoden kunde inte skickas.";

    } finally {
        otpRequestRunning =
            false;
    }
}


/*
 * =========================================================
 * OTP - ÅTERSKICKNINGSNEDRÄKNING
 * =========================================================
 */

function startResendCooldown() {
    if (resendTimer) {
        clearInterval(
            resendTimer
        );
    }

    let seconds =
        30;

    requestOtpButton.disabled =
        true;

    requestOtpButton.textContent =
        `Skicka ny kod om ${seconds} s`;

    resendTimer =
        setInterval(
            () => {
                seconds -= 1;

                if (
                    seconds <= 0
                ) {
                    clearInterval(
                        resendTimer
                    );

                    resendTimer =
                        null;

                    requestOtpButton.textContent =
                        "Skicka ny verifieringskod";

                    requestOtpButton.disabled =
                        otpVerified ||
                        !allConfirmationsChecked();

                    return;
                }

                requestOtpButton.textContent =
                    `Skicka ny kod om ${seconds} s`;
            },
            1000
        );
}


/*
 * =========================================================
 * OTP - VERIFIERA
 * =========================================================
 */

async function verifyOtp() {
    if (
        otpVerifyRunning ||
        otpVerified
    ) {
        return;
    }

    const code =
        String(
            otpCode.value || ""
        )
            .replace(
                /\D/g,
                ""
            )
            .slice(
                0,
                6
            );

    otpCode.value =
        code;

    if (
        !/^\d{6}$/.test(
            code
        )
    ) {
        otpVerifyMessage.textContent =
            "Ange alla sex siffror från verifieringsmeddelandet som skickades till din e-post.";

        otpCode.focus();
        return;
    }

    otpVerifyRunning =
        true;

    verifyOtpButton.disabled =
        true;

    verifyOtpButton.textContent =
        "Verifierar...";

    otpVerifyMessage.textContent =
        "Verifierar koden...";

    try {
        const response =
            await fetch(
                `${API_URL}/public/contracts/${encodeURIComponent(
                    token
                )}/otp/verify`,
                {
                    method:
                        "POST",

                    headers: {
                        Accept:
                            "application/json",

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            code
                        })
                }
            );

        const data =
            await readJsonResponse(
                response
            );

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Verifieringen misslyckades."
            );
        }

        if (
            !data.success ||
            !data.verified
        ) {
            throw new Error(
                "Verifieringen kunde inte bekräftas."
            );
        }

        otpVerifyMessage.textContent =
            "✓ E-postadressen är verifierad.";

        otpVerifyMessage.classList.add(
            "signing-message-success"
        );

        otpStep.classList.add(
            "signing-step-complete"
        );

        showVerifiedSigningSteps();

        signerName.focus();

    } catch (error) {
        verifyOtpButton.disabled =
            false;

        verifyOtpButton.textContent =
            "Verifiera kod";

        otpVerifyMessage.textContent =
            error.message ||
            "Verifieringen misslyckades.";

    } finally {
        otpVerifyRunning =
            false;
    }
}


/*
 * =========================================================
 * SIGNATURCANVAS
 * =========================================================
 */

function resizeSignatureCanvas() {
    if (
        !signatureCanvas ||
        signatureStep.hidden
    ) {
        return;
    }

    const rect =
        signatureCanvas
            .getBoundingClientRect();

    if (
        rect.width <= 0
    ) {
        return;
    }

    const ratio =
        Math.max(
            1,
            window.devicePixelRatio ||
            1
        );

    const currentImage =
        signatureHasContent
            ? signatureCanvas
                .toDataURL(
                    "image/png"
                )
            : null;

    signatureCanvas.width =
        Math.round(
            rect.width * ratio
        );

    signatureCanvas.height =
        Math.round(
            Math.max(
                220,
                rect.height || 220
            ) * ratio
        );

    const ctx =
        signatureCanvas
            .getContext(
                "2d"
            );

    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );

    ctx.lineWidth =
        2.2;

    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";

    ctx.strokeStyle =
        "#202431";

    if (currentImage) {
        const image =
            new Image();

        image.onload =
            () => {
                ctx.drawImage(
                    image,
                    0,
                    0,
                    rect.width,
                    Math.max(
                        220,
                        rect.height || 220
                    )
                );
            };

        image.src =
            currentImage;
    }
}


function getCanvasPoint(event) {
    const rect =
        signatureCanvas
            .getBoundingClientRect();

    return {
        x:
            event.clientX -
            rect.left,

        y:
            event.clientY -
            rect.top
    };
}


function startDrawing(event) {
    if (
        !otpVerified ||
        signingRunning
    ) {
        return;
    }

    event.preventDefault();

    drawing =
        true;

    signatureStarted =
        true;

    lastPoint =
        getCanvasPoint(
            event
        );

    if (
        signatureCanvas
            .setPointerCapture
    ) {
        signatureCanvas
            .setPointerCapture(
                event.pointerId
            );
    }
}


function drawSignature(event) {
    if (
        !drawing ||
        !lastPoint
    ) {
        return;
    }

    event.preventDefault();

    const currentPoint =
        getCanvasPoint(
            event
        );

    const ctx =
        signatureCanvas
            .getContext(
                "2d"
            );

    ctx.beginPath();

    ctx.moveTo(
        lastPoint.x,
        lastPoint.y
    );

    ctx.lineTo(
        currentPoint.x,
        currentPoint.y
    );

    ctx.stroke();

    lastPoint =
        currentPoint;

    signatureHasContent =
        true;

    signatureMessage.textContent =
        "Signaturen är registrerad.";

    updateFinalSigningState();
}


function stopDrawing(event) {
    if (!drawing) {
        return;
    }

    event.preventDefault();

    drawing =
        false;

    lastPoint =
        null;

    if (
        signatureStarted &&
        !signatureHasContent
    ) {
        signatureMessage.textContent =
            "Skriv din signatur i rutan ovan.";
    }
}


function clearSignature() {
    const ctx =
        signatureCanvas
            .getContext(
                "2d"
            );

    ctx.clearRect(
        0,
        0,
        signatureCanvas.width,
        signatureCanvas.height
    );

    signatureStarted =
        false;

    signatureHasContent =
        false;

    signatureMessage.textContent =
        "Skriv din signatur i rutan ovan.";

    updateFinalSigningState();
}


function getSignatureImage() {
    if (
        !signatureHasContent
    ) {
        return null;
    }

    return signatureCanvas
        .toDataURL(
            "image/png"
        );
}


/*
 * =========================================================
 * SLUTFÖR SIGNERING
 * =========================================================
 */

async function signContract() {
    if (
        signingRunning
    ) {
        return;
    }

    const name =
        String(
            signerName.value ||
            ""
        )
            .trim()
            .replace(
                /\s+/g,
                " "
            );

    if (!otpVerified) {
        signingStatus.textContent =
            "Din e-post måste verifieras innan avtalet kan signeras.";

        return;
    }

    if (
        !allConfirmationsChecked()
    ) {
        signingStatus.textContent =
            "Bekräfta samtliga avtalsvillkor innan du signerar.";

        return;
    }

    if (
        name.length < 2
    ) {
        signingStatus.textContent =
            "Ange ditt fullständiga namn.";

        signerName.focus();
        return;
    }

    if (
        !signatureHasContent
    ) {
        signingStatus.textContent =
            "Skriv din signatur innan du fortsätter.";

        return;
    }

    if (
        !confirmElectronicSignature
            .checked
    ) {
        signingStatus.textContent =
            "Bekräfta att du accepterar avtalet genom din elektroniska signatur.";

        return;
    }

    const signatureImage =
        getSignatureImage();

    if (!signatureImage) {
        signingStatus.textContent =
            "Signaturen kunde inte läsas. Försök igen.";

        return;
    }

    signingRunning =
        true;

    signContractButton.disabled =
        true;

    signContractButton.textContent =
        "Signerar avtalet...";

    signingStatus.textContent =
        "Din signering registreras säkert. Stäng inte sidan.";

    try {
        const response =
            await fetch(
                `${API_URL}/public/contracts/${encodeURIComponent(
                    token
                )}/sign`,
                {
                    method:
                        "POST",

                    headers: {
                        Accept:
                            "application/json",

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            signedName:
                                name,

                            signatureImage,

                            consents:
                                getConsentData(),

                            electronicSignatureAccepted:
                                true
                        })
                }
            );

        const data =
            await readJsonResponse(
                response
            );

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Avtalet kunde inte signeras."
            );
        }

        if (
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Signeringen kunde inte registreras."
            );
        }

        showSigningSuccess();

    } catch (error) {
        signContractButton.disabled =
            false;

        signContractButton.textContent =
            "Jag godkänner och signerar avtalet";

        signingStatus.textContent =
            error.message ||
            "Avtalet kunde inte signeras.";

        signingRunning =
            false;
    }
}


/*
 * =========================================================
 * SIGNERING KLAR
 * =========================================================
 */

function showSigningSuccess() {
    signingRunning =
        false;

    setConfirmationsDisabled(
        true
    );

    requestOtpButton.disabled =
        true;

    otpCode.disabled =
        true;

    verifyOtpButton.disabled =
        true;

    signerName.disabled =
        true;

    clearSignatureButton.disabled =
        true;

    confirmElectronicSignature.disabled =
        true;

    signContractButton.disabled =
        true;

    signerStep.hidden =
        true;

    signatureStep.hidden =
        true;

    finalSigningStep.hidden =
        true;

    signingSuccess.hidden =
        false;

    signingSuccess.scrollIntoView({
        behavior:
            "smooth",

        block:
            "center"
    });
}


/*
 * =========================================================
 * EVENT LISTENERS
 * =========================================================
 */

confirmations.forEach(
    (checkbox) => {
        if (!checkbox) {
            return;
        }

        checkbox.addEventListener(
            "change",
            () => {
                updateOtpRequestState();
                updateFinalSigningState();
            }
        );
    }
);


requestOtpButton.addEventListener(
    "click",
    requestOtp
);


verifyOtpButton.addEventListener(
    "click",
    verifyOtp
);


otpCode.addEventListener(
    "input",
    () => {
        otpCode.value =
            otpCode.value
                .replace(
                    /\D/g,
                    ""
                )
                .slice(
                    0,
                    6
                );
    }
);


otpCode.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key ===
            "Enter"
        ) {
            event.preventDefault();
            verifyOtp();
        }
    }
);


signerName.addEventListener(
    "input",
    updateFinalSigningState
);


confirmElectronicSignature.addEventListener(
    "change",
    updateFinalSigningState
);


signatureCanvas.addEventListener(
    "pointerdown",
    startDrawing
);

signatureCanvas.addEventListener(
    "pointermove",
    drawSignature
);

signatureCanvas.addEventListener(
    "pointerup",
    stopDrawing
);

signatureCanvas.addEventListener(
    "pointercancel",
    stopDrawing
);

signatureCanvas.addEventListener(
    "pointerleave",
    stopDrawing
);


clearSignatureButton.addEventListener(
    "click",
    clearSignature
);


signContractButton.addEventListener(
    "click",
    signContract
);


window.addEventListener(
    "resize",
    () => {
        window.requestAnimationFrame(
            resizeSignatureCanvas
        );
    }
);


/*
 * =========================================================
 * START
 * =========================================================
 */

loadContract();
/* =========================================================
   OTP INPUT NORMALIZATION
========================================================= */

if (otpCode) {
    otpCode.addEventListener(
        "input",
        () => {
            otpCode.value =
                String(
                    otpCode.value || ""
                )
                    .replace(
                        /\D/g,
                        ""
                    )
                    .slice(
                        0,
                        6
                    );
        }
    );

    otpCode.addEventListener(
        "paste",
        () => {
            setTimeout(
                () => {
                    otpCode.value =
                        String(
                            otpCode.value || ""
                        )
                            .replace(
                                /\D/g,
                                ""
                            )
                            .slice(
                                0,
                                6
                            );
                },
                0
            );
        }
    );
}

