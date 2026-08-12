/* ==========================================
   J&W Quality Hemservice CRM
   Customers Module
========================================== */


let customers = [];

let filteredCustomers = [];

let editingCustomer = null;

document.addEventListener(

    "DOMContentLoaded",

    initializeCustomers

);

/* ==========================================
   Init
========================================== */

async function initializeCustomers(){

    checkLogin();

    setupEvents();

    await loadCustomers();

}

/* ==========================================
   Login
========================================== */

function checkLogin(){

    const token = localStorage.getItem("token");

    if(!token){

        location.href = "login.html";

        return;

    }

    const user = JSON.parse(

        localStorage.getItem("user") || "{}"

    );

    const userBox = document.getElementById("userName");

    if(userBox){

        userBox.innerHTML = `

            <strong>${user.name || ""}</strong>

            <br>

            ${user.role || ""}

        `;

    }

}

/* ==========================================
   Events
========================================== */

function setupEvents(){

    document
        .getElementById("logout")
        .onclick = logout;

    document
        .getElementById("searchInput")
        .addEventListener(
            "input",
            filterCustomers
        );

    document
        .getElementById("customerFilter")
        .addEventListener(
            "change",
            filterCustomers
        );

    document
        .getElementById("newCustomerBtn")
        .onclick = openNewCustomer;

    document
        .getElementById("closeCustomer")
        .onclick = closeCustomer;

    document
        .getElementById("customerForm")
        .onsubmit = saveCustomer;

}

/* ==========================================
   Logout
========================================== */

function logout(){

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    location.href = "login.html";

}

/* ==========================================
   Load Customers
========================================== */

async function loadCustomers(){



    try{

        const token =

            localStorage.getItem("token");

        const response =

            await fetch(

                `${API_URL}/customers`,

                {

                    headers:{

                        Authorization:

                        `Bearer ${token}`

                    }

                }

            );

        customers =

            await response.json();

        filteredCustomers =

            [...customers];

        renderCustomers();

        updateStatistics();



    }

    catch(error){

        console.error(error);



        showToast(

            "Kunde inte läsa kunder",

            "error"

        );

    }

}

/* ==========================================
   Render Customers
========================================== */

function renderCustomers(){

    const tbody =

        document.getElementById(

            "customerTable"

        );

    tbody.innerHTML = "";

    if(filteredCustomers.length===0){

        tbody.innerHTML = `

        <tr>

            <td colspan="7">

                Inga kunder hittades

            </td>

        </tr>

        `;

        return;

    }

    filteredCustomers

    .slice()

    .reverse()

    .forEach(customer=>{

        const tr =

            document.createElement("tr");

        tr.innerHTML = `

        <td>

            ${escapeHtml(customer.name||"")}

        </td>

        <td>

            ${escapeHtml(customer.phone||"")}

        </td>

        <td>

            ${escapeHtml(customer.email||"")}

        </td>

        <td>

            ${escapeHtml(customer.address||"")}

        </td>

        <td>

            ${escapeHtml(customer.lastOffer||"-")}

        </td>

        <td>

            ${renderStatus(

                customer.status||"Aktiv"

            )}

        </td>

        <td>

            <div class="action-buttons">

                <button

                    class="view-btn"

                    onclick="viewCustomer(${customer.id})"

                    title="Visa">

                    ðŸ‘

                </button>

                <button

                    class="edit-btn"

                    onclick="editCustomer(${customer.id})"

                    title="Redigera">

                    âœï¸

                </button>

                <button

                    class="offer-btn"

                    onclick="newOffer(${customer.id})"

                    title="Ny offert">

                    ðŸ“„

                </button>

                <button

                    class="delete-btn"

                    onclick="deleteCustomer(${customer.id})"

                    title="Ta bort">

                    ðŸ—‘

                </button>

            </div>

        </td>

        `;

        tbody.appendChild(tr);

    });

}

/* ==========================================
   Status
========================================== */

function renderStatus(status){

    switch(status){

        case "Aktiv":

            return '<span class="status status-active">Aktiv</span>';

        case "Inaktiv":

            return '<span class="status status-inactive">Inaktiv</span>';

        default:

            return status;

    }

}

/* ==========================================
   Statistics
========================================== */

function updateStatistics(){

    document

    .getElementById("customerCount")

    .textContent =

        customers.length;

    document

    .getElementById("activeCustomers")

    .textContent =

        customers.filter(

            c=>c.status==="Aktiv"

        ).length;

    document

    .getElementById("approvedOffers")

    .textContent =

        customers.filter(

            c=>c.lastOffer

        ).length;

    document

    .getElementById("plannedJobs")

    .textContent =

        customers.filter(

            c=>c.nextJob

        ).length;

}

/* ==========================================
   Search + Filter
========================================== */

function filterCustomers(){

    const search =

        document

        .getElementById("searchInput")

        .value

        .toLowerCase();

    const filter =

        document

        .getElementById("customerFilter")

        .value;

    filteredCustomers =

        customers.filter(customer=>{

            const matchSearch =

            (customer.name||"")

            .toLowerCase()

            .includes(search)

            ||

            (customer.phone||"")

            .toLowerCase()

            .includes(search)

            ||

            (customer.email||"")

            .toLowerCase()

            .includes(search);

            const matchFilter =

                filter===""

                ||

                customer.status===filter;

            return(

                matchSearch

                &&

                matchFilter

            );

        });

    renderCustomers();

}

/* ==========================================
   Customer Modal
========================================== */

function openNewCustomer(){

    editingCustomer = null;

    document.getElementById(

        "modalTitle"

    ).textContent =

        "Ny kund";

    document

        .getElementById("customerForm")

        .reset();

    document

        .getElementById("customerModal")

        .classList.add("active");

}

function closeCustomer(){

    document

        .getElementById("customerModal")

        .classList.remove("active");

}

/* ==========================================
   Edit Customer
========================================== */

function editCustomer(id){

    editingCustomer =

        customers.find(

            c => c.id == id

        );

    if(!editingCustomer){

        return;

    }

    document.getElementById("modalTitle").textContent =
        "Redigera kund";

    document.getElementById("customerName").value =
        editingCustomer.name || "";

    document.getElementById("customerPhone").value =
        editingCustomer.phone || "";

    document.getElementById("customerEmail").value =
        editingCustomer.email || "";

    document.getElementById("customerAddress").value =
        editingCustomer.address || "";

    document.getElementById("customerService").value =
        editingCustomer.service || "";

    document.getElementById("customerStatus").value =
        editingCustomer.status || "Aktiv";

    document.getElementById("customerNotes").value =
        editingCustomer.notes || "";

    document

        .getElementById("customerModal")

        .classList.add("active");

}

/* ==========================================
   Save Customer
========================================== */

async function saveCustomer(e){

    e.preventDefault();

    const token =

        localStorage.getItem("token");

    const customer = {

        name:

            document.getElementById(

                "customerName"

            ).value,

        phone:

            document.getElementById(

                "customerPhone"

            ).value,

        email:

            document.getElementById(

                "customerEmail"

            ).value,

        address:

            document.getElementById(

                "customerAddress"

            ).value,

        service:

            document.getElementById(

                "customerService"

            ).value,

        status:

            document.getElementById(

                "customerStatus"

            ).value,

        notes:

            document.getElementById(

                "customerNotes"

            ).value

    };

    try{

        if(editingCustomer){

            await fetch(

                `${API_URL}/customers/${editingCustomer.id}`,

                {

                    method:"PUT",

                    headers:{

                        "Content-Type":"application/json",

                        Authorization:

                        `Bearer ${token}`

                    },

                    body:JSON.stringify(customer)

                }

            );

            showToast(

                "Kunden uppdaterades"

            );

        }

        else{

            await fetch(

                `${API_URL}/customers`,

                {

                    method:"POST",

                    headers:{

                        "Content-Type":"application/json",

                        Authorization:

                        `Bearer ${token}`

                    },

                    body:JSON.stringify(customer)

                }

            );

            showToast(

                "Ny kund skapad"

            );

        }

        closeCustomer();

        await loadCustomers();

    }

    catch(error){

        console.error(error);

        showToast(

            "Kunde inte spara kunden",

            "error"

        );

    }

}

/* ==========================================
   View Customer
========================================== */

function viewCustomer(id){

    const customer = customers.find(

        c => c.id == id

    );

    if(!customer){

        return;

    }

    alert(

`Kund

----------------------------

Namn:
${customer.name || ""}

Telefon:
${customer.phone || ""}

E-post:
${customer.email || ""}

Adress:
${customer.address || ""}

Tjänst:
${customer.service || ""}

Status:
${customer.status || ""}

Anteckningar:

${customer.notes || "-"}

`

    );

}

/* ==========================================
   Create Offer
========================================== */

function newOffer(id){

    const customer = customers.find(

        c => c.id == id

    );

    if(!customer){

        return;

    }

    localStorage.setItem(

        "selectedCustomer",

        JSON.stringify(customer)

    );

    location.href="offers.html";

}

/* ==========================================
   Create Job
========================================== */

function createJob(){

    showToast(

        "Jobb-modulen byggs i nästa steg"

    );

}

/* ==========================================
   Delete Customer
========================================== */

async function deleteCustomer(id){

    if(

        !confirm(

            "Vill du ta bort kunden?"

        )

    ){

        return;

    }

    try{

        const token =

            localStorage.getItem("token");

        await fetch(

            `${API_URL}/customers/${id}`,

            {

                method:"DELETE",

                headers:{

                    Authorization:

                    `Bearer ${token}`

                }

            }

        );

        showToast(

            "Kunden borttagen"

        );

        await loadCustomers();

    }

    catch(error){

        console.error(error);

        showToast(

            "Kunde inte ta bort kunden",

            "error"

        );

    }

}

/* ==========================================
   Helpers
========================================== */

function escapeHtml(text){

    const div =

        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}

/* ==========================================
   Auto Refresh
========================================== */

/* setInterval(loadCustomers, 30000); */
