

document.addEventListener("DOMContentLoaded", initDashboard);

async function initDashboard() {



    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    if (document.getElementById("userName")) {

        document.getElementById("userName").innerHTML = `
            <strong>${user.name || ""}</strong><br>
            ${user.role || ""}
        `;

    }

    const logout = document.getElementById("logout");

    if (logout) {

        logout.onclick = (e) => {

            e.preventDefault();

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            location.href = "login.html";

        };

    }

    await loadDashboard();

}

async function loadDashboard() {



    try {



        const leads = await apiGet("/leads");

        updateStatistics(leads);

        buildLeadTable(leads);

        createChart(leads);





    }

    catch (err) {



        console.error(err);

        showToast(
            "Kunde inte hÃ¤mta data",
            "error"
        );

    }

}

function updateStatistics(leads) {

    document.getElementById("leadCount").textContent =
        leads.length;

    document.getElementById("customerCount").textContent =
        leads.filter(
            l => l.status === "Customer"
        ).length;

    document.getElementById("offerCount").textContent =
        leads.filter(
            l => l.offerNumber
        ).length;

}

function buildLeadTable(leads) {

    const tbody =
        document.getElementById("leadTable");

    tbody.innerHTML = "";

    leads
        .slice()
        .reverse()
        .slice(0, 10)
        .forEach(lead => {

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${escapeHtml(lead.name || "")}</td>
                <td>${escapeHtml(lead.phone || "")}</td>
                <td>${escapeHtml(lead.status || "Ny")}</td>
                <td>${escapeHtml(lead.area || "")}</td>
            `;

            tbody.appendChild(tr);

        });

}
let leadChart = null;

function createChart(leads) {

    const count = {};

    leads.forEach(lead => {

        const area = lead.area || "OkÃ¤nd";

        count[area] = (count[area] || 0) + 1;

    });

    const ctx = document.getElementById("leadChart");

    if (!ctx) return;
    if (leadChart) {
    leadChart.destroy();
}

    leadChart = new Chart(ctx, {


        type: "bar",

        data: {

            labels: Object.keys(count),

            datasets: [{

                label: "Leads",

                data: Object.values(count),

                borderWidth: 1

            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            plugins: {

                legend: {

                    display: false

                }

            }

        }

    });

}
