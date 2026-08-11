const API_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:3000/api"
        : "/api";

let contracts = [];

function requireLogin() {
    const token = localStorage.getItem("token");

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

    logout?.addEventListener(
        "click",
        (event) => {
            event.preventDefault();

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            location.href = "login.html";
        }
    );
}

function statusLabel(status) {
    const labels = {
        draft: "Utkast",
        sent: "Skickat",
        opened: "Öppnat",
        signing: "BankID påbörjat",
        signed: "Signerat",
        expired: "Utgånget",
        cancelled: "Avslutat"
    };

    return labels[status] || status || "-";
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "sv-SE"
    ).format(new Date(value));
}

function renderSummary() {
    document.getElementById(
        "contractsTotal"
    ).textContent = contracts.length;

    document.getElementById(
        "contractsDraft"
    ).textContent = contracts.filter(
        (contract) =>
            contract.status === "draft"
    ).length;

    document.getElementById(
        "contractsSent"
    ).textContent = contracts.filter(
        (contract) =>
            contract.status === "sent"
    ).length;

    document.getElementById(
        "contractsSigned"
    ).textContent = contracts.filter(
        (contract) =>
            contract.status === "signed"
    ).length;
}

function actionButtons(contract) {
    const customerName = [
        contract.customer_first_name,
        contract.customer_last_name
    ]
        .filter(Boolean)
        .join(" ");

    if (contract.status === "draft") {
        return `
            <div class="contract-action-buttons">
                <button
                    class="contract-send-button"
                    data-id="${contract.id}"
                >
                    Skicka avtal
                </button>

                <button
                    class="contract-delete-button"
                    data-id="${contract.id}"
                    data-name="${customerName}"
                    data-number="${contract.contract_number}"
                    data-status="${contract.status}"
                >
                    Ta bort
                </button>
            </div>
        `;
    }

    if (
        contract.status === "sent" ||
        contract.status === "opened" ||
        contract.status === "signing" ||
        contract.status === "signed"
    ) {
        return `
            <div class="contract-action-buttons">
                <span class="contract-action-info">
                    ${
                        contract.status === "signed"
                            ? "Signerat"
                            : "Väntar på signering"
                    }
                </span>

                <button
                    class="contract-delete-button"
                    data-id="${contract.id}"
                    data-name="${customerName}"
                    data-number="${contract.contract_number}"
                    data-status="${contract.status}"
                >
                    Ta bort
                </button>
            </div>
        `;
    }

    return "-";
}
function renderContracts() {
    const body =
        document.getElementById(
            "contractsTableBody"
        );

    const search =
        (
            document.getElementById(
                "contractSearch"
            )?.value || ""
        )
            .trim()
            .toLowerCase();

    const status =
        document.getElementById(
            "contractStatusFilter"
        )?.value || "";

    const filtered =
        contracts.filter((contract) => {
            const haystack = [
                contract.contract_number,
                contract.customer_first_name,
                contract.customer_last_name,
                contract.customer_email
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const searchMatch =
                !search ||
                haystack.includes(search);

            const statusMatch =
                !status ||
                contract.status === status;

            return searchMatch && statusMatch;
        });

    if (!filtered.length) {
        body.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="contract-empty"
                >
                    Inga avtal hittades.
                </td>
            </tr>
        `;
        return;
    }

    body.innerHTML =
        filtered
            .map((contract) => {
                const fullName = [
                    contract.customer_first_name,
                    contract.customer_last_name
                ]
                    .filter(Boolean)
                    .join(" ");

                return `
                    <tr>
                        <td>
                            <strong>
                                ${contract.contract_number}
                            </strong>
                        </td>

                        <td>
                            <strong>
                                ${fullName}
                            </strong>
                            <br>
                            <small>
                                ${contract.customer_email || ""}
                            </small>
                        </td>

                        <td>
                            ${formatDate(
                                contract.start_date
                            )}
                        </td>

                        <td>
                            ${
                                contract.service_frequency ||
                                "Hemstädning"
                            }
                            ${
                                contract.service_hours
                                    ? `<br><small>${contract.service_hours} tim</small>`
                                    : ""
                            }
                        </td>

                        <td>
                            <span class="contract-status">
                                ${statusLabel(
                                    contract.status
                                )}
                            </span>
                        </td>

                        <td>
                            ${formatDate(
                                contract.created_at
                            )}
                        </td>

                        <td>
                            ${actionButtons(contract)}
                        </td>
                    </tr>
                `;
            })
            .join("");

    document
        .querySelectorAll(
            ".contract-send-button"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    sendContract(
                        button.dataset.id,
                        button
                    );
                }
            );
        });
    document
        .querySelectorAll(
            ".contract-delete-button"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    deleteContract(
                        button.dataset.id,
                        button.dataset.name,
                        button.dataset.number,
                        button.dataset.status
                    );
                }
            );
        });
}

async function sendContract(id, button) {
    const token =
        localStorage.getItem("token");

    const confirmed =
        confirm(
            "Skicka avtalet till kunden via e-post och SMS?"
        );

    if (!confirmed) {
        return;
    }

    const originalText =
        button.textContent;

    try {
        button.disabled = true;
        button.textContent =
            "Skickar...";

        const response =
            await fetch(
                `${API_URL}/contracts/${id}/send`,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Kunde inte skicka avtalet."
            );
        }

        alert(
            `Avtalet har skickats.\n\nE-post: ${
                data.delivery?.email?.sent
                    ? "Ja"
                    : "Nej"
            }\nSMS: ${
                data.delivery?.sms?.sent
                    ? "Ja"
                    : "Nej"
            }`
        );

        await loadContracts();

    } catch (error) {
        console.error(error);

        alert(
            `Fel: ${error.message}`
        );

        button.disabled = false;
        button.textContent =
            originalText;
    }
}

async function deleteContract(
    id,
    customerName,
    contractNumber,
    status
) {
    const isDraft =
        status === "draft";

    const isSigned =
        status === "signed";

    const warning = isDraft
        ? `Du håller på att permanent ta bort ett utkast.

Kund: ${customerName}
Avtal: ${contractNumber}`
        : `VARNING – AVTALET ÄR REDAN SKICKAT ELLER SIGNERAT.

Kund: ${customerName}
Avtal: ${contractNumber}

Avtalet tas bort från den aktiva CRM-listan men den juridiska historiken bevaras i arkivet.`;

    if (!confirm(warning)) {
        return;
    }

    const typedName = prompt(
        `Skriv kundens namn exakt för att bekräfta:

${customerName}`
    );

    if (typedName === null) {
        return;
    }

    if (
        typedName.trim().toLowerCase() !==
        customerName.trim().toLowerCase()
    ) {
        alert(
            "Namnet stämmer inte. Ingen ändring har gjorts."
        );
        return;
    }

    if (!isDraft) {
        const typedNumber = prompt(
            `Skriv även avtalsnumret exakt:

${contractNumber}`
        );

        if (typedNumber === null) {
            return;
        }

        if (
            typedNumber.trim().toUpperCase() !==
            contractNumber.trim().toUpperCase()
        ) {
            alert(
                "Avtalsnumret stämmer inte. Ingen ändring har gjorts."
            );
            return;
        }
    }

    const finalMessage =
        isDraft
            ? `Sista bekräftelsen.

Ta bort ${contractNumber} permanent?`
            : isSigned
                ? `SISTA BEKRÄFTELSEN – SIGNERAT BANKID-AVTAL.

Avtalet försvinner från den aktiva listan men originaldata och signeringshistorik bevaras.

Fortsätta?`
                : `Sista bekräftelsen.

Avtalet arkiveras och tas bort från den aktiva listan.

Fortsätta?`;

    if (!confirm(finalMessage)) {
        return;
    }

    const token =
        localStorage.getItem("token");

    const url = isDraft
        ? `${API_URL}/contracts/${id}`
        : `${API_URL}/contracts/${id}/archive`;

    const method =
        isDraft
            ? "DELETE"
            : "POST";

    try {
        const response =
            await fetch(
                url,
                {
                    method,

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Åtgärden kunde inte genomföras."
            );
        }

        alert(
            isDraft
                ? `Avtalet ${contractNumber} har tagits bort.`
                : `Avtalet ${contractNumber} har arkiverats och tagits bort från den aktiva listan.`
        );

        await loadContracts();

    } catch (error) {
        console.error(error);

        alert(
            `Fel: ${error.message}`
        );
    }
}
async function loadContracts() {
    const message =
        document.getElementById(
            "contractsMessage"
        );

    const token =
        localStorage.getItem("token");

    try {
        const response =
            await fetch(
                `${API_URL}/contracts`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Kunde inte läsa avtal."
            );
        }

        contracts =
            Array.isArray(data.contracts)
                ? data.contracts
                : [];

        renderSummary();
        renderContracts();

        if (message) {
            message.textContent = "";
            message.className =
                "contract-message";
        }

    } catch (error) {
        console.error(error);

        if (message) {
            message.textContent =
                error.message;

            message.className =
                "contract-message error";
        }
    }
}

if (requireLogin()) {
    setupLogout();

    document
        .getElementById("contractSearch")
        ?.addEventListener(
            "input",
            renderContracts
        );

    document
        .getElementById(
            "contractStatusFilter"
        )
        ?.addEventListener(
            "change",
            renderContracts
        );

    loadContracts();
}
