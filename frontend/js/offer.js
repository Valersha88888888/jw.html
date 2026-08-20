const API_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:3000/api"
        : "https://jw-quality-hemservice-crm.onrender.com/api";

const form = document.getElementById("leadForm");
const submitButton = document.getElementById("submitButton");
const formMessage = document.getElementById("formMessage");

const area = document.getElementById("area");
const otherArea = document.getElementById("otherArea");
const otherAreaGroup =
    document.getElementById("otherAreaGroup");

function updateAreaField() {
    const showOtherArea =
        area.value === "Annat område i Stockholm";

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

area.addEventListener(
    "change",
    updateAreaField
);

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    showMessage("", "");

    submitButton.disabled = true;
    submitButton.textContent = "SKICKAR...";

    const data = {
        serviceType: "Städförfrågan",
        otherService: "",
        size: "",
        squareMeters: "",
        area: form.area.value,
        otherArea: form.otherArea.value.trim(),
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        notes: "",
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
                result?.errors?.join(", ") ||
                "Kunde inte skicka din förfrågan."
            );
        }

        showMessage(
            "Tack! Din förfrågan är mottagen. Vi kontaktar dig så snart som möjligt.",
            "success"
        );

        if (typeof fbq === "function") {
            fbq("track", "Lead");
        }

        form.reset();
        updateAreaField();

    } catch (error) {
        console.error(
            "Lead submission failed:",
            error
        );

        showMessage(
            "Något gick fel. Försök igen eller kontakta oss via telefon.",
            "error"
        );

    } finally {
        submitButton.disabled = false;
        submitButton.textContent =
            "FÅ MIN KOSTNADSFRIA OFFERT";
    }
});

updateAreaField();