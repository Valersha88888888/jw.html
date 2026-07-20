const API_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:3000/api"
        : "/api";

const form = document.getElementById("leadForm");
const submitButton = document.getElementById("submitButton");
const formMessage = document.getElementById("formMessage");

const serviceType = document.getElementById("serviceType");
const otherService = document.getElementById("otherService");
const otherServiceGroup =
    document.getElementById("otherServiceGroup");

const area = document.getElementById("area");
const otherArea = document.getElementById("otherArea");
const otherAreaGroup =
    document.getElementById("otherAreaGroup");

function updateConditionalFields() {
    const showOtherService =
        serviceType.value === "Annan tjÃ¤nst";

    otherServiceGroup.classList.toggle(
        "hidden",
        !showOtherService
    );

    otherService.required = showOtherService;

    if (!showOtherService) {
        otherService.value = "";
    }

    const showOtherArea =
        area.value === "Annat omrÃ¥de i Stockholm";

    otherAreaGroup.classList.toggle(
        "hidden",
        !showOtherArea
    );

    otherArea.required = showOtherArea;

    if (!showOtherArea) {
        otherArea.value = "";
    }
}

function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className =
        `form-message ${type}`;
}

serviceType.addEventListener(
    "change",
    updateConditionalFields
);

area.addEventListener(
    "change",
    updateConditionalFields
);

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    showMessage("", "");

    submitButton.disabled = true;
    submitButton.textContent = "SKICKAR...";

    const data = {
        serviceType: form.serviceType.value,
        otherService: form.otherService.value.trim(),
        size: form.size.value,
        squareMeters:
            form.squareMeters.value.trim(),
        area: form.area.value,
        otherArea: form.otherArea.value.trim(),
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        source: "offer-page"
    };

    try {
        const response = await fetch(
            `${API_URL}/public/leads`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );

        let result = null;

        try {
            result = await response.json();
        } catch {
            result = null;
        }

        if (!response.ok) {
            throw new Error(
                result?.message ||
                "Kunde inte skicka din fÃ¶rfrÃ¥gan."
            );
        }

        showMessage(
            "Tack! Din fÃ¶rfrÃ¥gan har skickats. Vi kontaktar dig inom kort.",
            "success"
        );

        form.reset();
        updateConditionalFields();

        if (
            typeof fbq === "function"
        ) {
            fbq("track", "Lead");
        }
    } catch (error) {
        console.error(
            "Lead submission failed:",
            error
        );

        showMessage(
            "NÃ¥got gick fel. FÃ¶rsÃ¶k igen eller kontakta oss via telefon.",
            "error"
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent =
            "FÃ… MIN GRATIS OFFERT";
    }
});

updateConditionalFields();
