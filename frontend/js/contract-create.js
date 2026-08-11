const API_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:3000/api"
        : "/api";

function requireLogin() {
    const token =
        localStorage.getItem("token");

    if (!token) {
        location.href = "login.html";
        return false;
    }

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const userName =
        document.getElementById("userName");

    if (userName) {
        userName.textContent =
            user.name ||
            user.email ||
            "";
    }

    return true;
}

function setupLogout() {
    const logout =
        document.getElementById("logout");

    if (!logout) {
        return;
    }

    logout.addEventListener(
        "click",
        (event) => {
            event.preventDefault();

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            location.href = "login.html";
        }
    );
}

function getValue(id) {
    return (
        document
            .getElementById(id)
            ?.value
            ?.trim() || ""
    );
}

async function createContract(event) {
    event.preventDefault();

    const message =
        document.getElementById(
            "contractFormMessage"
        );

    const button =
        document.getElementById(
            "createContractButton"
        );

    message.textContent = "";
    message.className = "contract-message";

    const payload = {
        customerFirstName:
            getValue("customerFirstName"),

        customerLastName:
            getValue("customerLastName"),

        customerPersonnummer:
            getValue("customerPersonnummer"),

        customerAddress:
            getValue("customerAddress"),

        customerPostalCode:
            getValue("customerPostalCode"),

        customerCity:
            getValue("customerCity"),

        customerPhone:
            getValue("customerPhone"),

        customerEmail:
            getValue("customerEmail"),

        serviceAddress:
            getValue("serviceAddress"),

        servicePostalCode:
            getValue("servicePostalCode"),

        serviceCity:
            getValue("serviceCity"),

        serviceAreaM2:
            getValue("serviceAreaM2")
                ? Number(
                    getValue("serviceAreaM2")
                )
                : null,

        serviceFrequency:
            getValue("serviceFrequency"),

        serviceHours:
            getValue("serviceHours")
                ? Number(
                    getValue("serviceHours")
                )
                : null,

        serviceDay:
            getValue("serviceDay"),

        serviceTime:
            getValue("serviceTime"),

        startDate:
            getValue("startDate")
    };

    if (
        !payload.customerFirstName ||
        !payload.customerLastName ||
        !payload.customerEmail ||
        !payload.serviceAddress ||
        !payload.startDate
    ) {
        message.textContent =
            "Fyll i alla obligatoriska fält.";

        message.classList.add("error");

        return;
    }

    const token =
        localStorage.getItem("token");

    try {
        button.disabled = true;
        button.textContent = "Skapar...";

        const response = await fetch(
            `${API_URL}/contracts`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`
                },

                body:
                    JSON.stringify(payload)
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Kunde inte skapa avtalet."
            );
        }

        message.textContent =
            `Avtal ${data.contract.contract_number} skapades.`;

        message.classList.add("success");

        setTimeout(() => {
            location.href =
                "contracts.html";
        }, 800);

    } catch (error) {
        console.error(error);

        message.textContent =
            error.message;

        message.classList.add("error");
    } finally {
        button.disabled = false;
        button.textContent = "Skapa avtal";
    }
}

if (requireLogin()) {
    setupLogout();

    const form =
        document.getElementById(
            "contractCreateForm"
        );

    form?.addEventListener(
        "submit",
        createContract
    );
}
