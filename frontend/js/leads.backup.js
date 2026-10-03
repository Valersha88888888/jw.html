/* ==========================================
   J&W Quality Hemservice CRM
   Leads Module
========================================== */


let leads = [];

let filteredLeads = [];

let editingLead = null;

document.addEventListener(

    "DOMContentLoaded",

    initializeLeads

);

async function initializeLeads(){

    checkLogin();

    setupEvents();

    await loadLeads();

}

function checkLogin(){

    const token = localStorage.getItem("token");

    if(!token){

        location.href="login.html";

        return;

    }

    const user=JSON.parse(

        localStorage.getItem("user")||"{}"

    );

    const userName=document.getElementById("userName");

    if(userName){

        userName.innerHTML=`
            <strong>${user.name||""}</strong>
            <br>
            ${user.role||""}
        `;

    }

}

function setupEvents(){

    const logout=document.getElementById("logout");

    if(logout){

        logout.onclick=()=>{

            localStorage.removeItem("token");

            localStorage.removeItem("user");

            location.href="login.html";

        };

    }

    document

    .getElementById("searchInput")

    .addEventListener(

        "input",

        filterLeads

    );

    document

    .getElementById("statusFilter")

    .addEventListener(

        "change",

        filterLeads

    );

    document

    .getElementById("newLeadBtn")

    .onclick=openNewLead;

    document

    .getElementById("cancelLead")

    .onclick=closeModal;

    document

    .getElementById("leadForm")

    .onsubmit=saveLead;

    document

    .getElementById("refreshBtn")

    .onclick=loadLeads;

}

async function loadLeads(){



    try{

        leads = await apiGet("/leads");

        filteredLeads = [...leads];

        renderTable();

        updateStatistics();

    }

    catch(error){

        console.error(error);

        showToast(

            "Kunde inte hämta leads",

            "error"

        );

    }

    finally{



    }

}
/* ==========================================
   Render Leads Table
========================================== */

function renderTable(){

    const tbody=document.getElementById("leadTable");

    tbody.innerHTML="";

    if(filteredLeads.length===0){

        tbody.innerHTML=`

        <tr>

            <td colspan="6">

                Inga leads hittades

            </td>

        </tr>

        `;

        return;

    }

    filteredLeads

    .slice()

    .reverse()

    .forEach(lead=>{

        const row=document.createElement("tr");

        row.innerHTML=`

        <td>

            ${escapeHtml(lead.name||"")}

        </td>

        <td>

            ${escapeHtml(lead.phone||"")}

        </td>

        <td>

            ${escapeHtml(lead.email||"")}

        </td>

        <td>

            ${escapeHtml(lead.area||"")}

        </td>

        <td>

            ${renderStatus(

                lead.status||"Ny"

            )}

        </td>

        <td>

            <div class="action-buttons">

                <button

                    class="view-btn"

                    onclick="viewLead(${lead.id})"

                    title="Visa">

                    👁

                </button>

                <button

                    class="edit-btn"

                    onclick="editLead(${lead.id})"

                    title="Redigera">

                    ✏️

                </button>

                <button

                    class="offer-btn"

                    onclick="createOffer(${lead.id})"

                    title="Skapa offert">

                    📄

                </button>

                <button

                    class="mail-btn"

                    onclick="sendMail(${lead.id})"

                    title="Mail">

                    📧

                </button>

                <button

                    class="delete-btn"

                    onclick="deleteLead(${lead.id})"

                    title="Ta bort">

                    🗑

                </button>

            </div>

        </td>

        `;

        tbody.appendChild(row);

    });

}

/* ==========================================
   Status
========================================== */

function renderStatus(status){

    switch(status){

        case "Ny":

            return '<span class="status status-new">Ny</span>';

        case "Kontaktad":

            return '<span class="status status-contact">Kontaktad</span>';

        case "Bokad":

            return '<span class="status status-booked">Bokad</span>';

        case "Offert skickad":

            return '<span class="status status-offer">Offert</span>';

        case "Kund":

            return '<span class="status status-customer">Kund</span>';

        default:

            return status;

    }

}

/* ==========================================
   Statistics
========================================== */

function updateStatistics(){

    document.getElementById("totalLeads").textContent=

        leads.length;

    document.getElementById("newLeads").textContent=

        leads.filter(

            x=>

            (x.status||"Ny")==="Ny"

        ).length;

    document.getElementById("offerLeads").textContent=

        leads.filter(

            x=>x.offerNumber

        ).length;

    document.getElementById("customerLeads").textContent=

        leads.filter(

            x=>x.status==="Kund"

        ).length;

}

/* ==========================================
   Search + Filter
========================================== */

function filterLeads(){

    const search=

        document

        .getElementById("searchInput")

        .value

        .toLowerCase();

    const status=

        document

        .getElementById("statusFilter")

        .value;

    filteredLeads=

    leads.filter(lead=>{

        const matchesSearch=

        (lead.name||"")

        .toLowerCase()

        .includes(search)

        ||

        (lead.phone||"")

        .toLowerCase()

        .includes(search)

        ||

        (lead.email||"")

        .toLowerCase()

        .includes(search)

        ||

        (lead.area||"")

        .toLowerCase()

        .includes(search);

        const matchesStatus=

        status===""

        ||

        (lead.status||"Ny")===status;

        return(

            matchesSearch

            &&

            matchesStatus

        );

    });

    renderTable();

}
/* ==========================================
   Modal
========================================== */

function openNewLead(){

    editingLead = null;

    document.getElementById("modalTitle").textContent =
        "Ny Lead";

    document.getElementById("leadForm").reset();

    document
        .getElementById("leadModal")
        .classList.add("active");

}

function closeModal(){

    document
        .getElementById("leadModal")
        .classList.remove("active");

}

function editLead(id){

    editingLead = leads.find(

        lead => lead.id == id

    );

    if(!editingLead){

        return;

    }

    document.getElementById("modalTitle").textContent =
        "Redigera Lead";

    document.getElementById("leadName").value =
        editingLead.name || "";

    document.getElementById("leadPhone").value =
        editingLead.phone || "";

    document.getElementById("leadEmail").value =
        editingLead.email || "";

    document.getElementById("leadArea").value =
        editingLead.area || "";

    document.getElementById("leadStatus").value =
        editingLead.status || "Ny";

    document.getElementById("leadService").value =
        editingLead.serviceType || "";

    document.getElementById("leadNotes").value =
        editingLead.notes || "";

    document
        .getElementById("leadModal")
        .classList.add("active");

}

/* ==========================================
   Save Lead
========================================== */

async function saveLead(e){

    e.preventDefault();

    const token =
        localStorage.getItem("token");

    const lead = {

        name:
            document.getElementById("leadName").value,

        phone:
            document.getElementById("leadPhone").value,

        email:
            document.getElementById("leadEmail").value,

        area:
            document.getElementById("leadArea").value,

        status:
            document.getElementById("leadStatus").value,

        serviceType:
            document.getElementById("leadService").value,

        notes:
            document.getElementById("leadNotes").value

    };

    try{

        if(editingLead){

            await fetch(

                `${API_URL}/leads/${editingLead.id}`,

                {

                    method:"PUT",

                    headers:{

                        "Content-Type":"application/json",

                        Authorization:
                        `Bearer ${token}`

                    },

                    body:JSON.stringify(lead)

                }

            );

            showToast(

                "Lead uppdaterad"

            );

        }

        else{

            await fetch(

                `${API_URL}/leads`,

                {

                    method:"POST",

                    headers:{

                        "Content-Type":"application/json",

                        Authorization:
                        `Bearer ${token}`

                    },

                    body:JSON.stringify(lead)

                }

            );

            showToast(

                "Lead skapad"

            );

        }

        closeModal();

        await loadLeads();

    }

    catch(error){

        console.error(error);

        showToast(

            "Kunde inte spara lead",

            "error"

        );

    }

}

/* ==========================================
   Delete Lead
========================================== */

async function deleteLead(id){

    if(

        !confirm(

            "Vill du ta bort denna lead?"

        )

    ){

        return;

    }

    try{

        const token =
            localStorage.getItem("token");

        await fetch(

            `${API_URL}/leads/${id}`,

            {

                method:"DELETE",

                headers:{

                    Authorization:
                    `Bearer ${token}`

                }

            }

        );

        showToast(

            "Lead borttagen"

        );

        await loadLeads();

    }

    catch(error){

        console.error(error);

        showToast(

            "Kunde inte ta bort lead",

            "error"

        );

    }

}
/* ==========================================
   View Lead
========================================== */

function viewLead(id){

    const lead = leads.find(

        l => l.id == id

    );

    if(!lead){

        return;

    }

    alert(

`Namn: ${lead.name || ""}

Telefon: ${lead.phone || ""}

E-post: ${lead.email || ""}

Ort: ${lead.area || ""}

Status: ${lead.status || "Ny"}

Tjänst: ${lead.serviceType || ""}

Anteckningar:

${lead.notes || "-"}`

    );

}

/* ==========================================
   Create Offer
========================================== */

function createOffer(id){

    const lead = leads.find(

        l => l.id == id

    );

    if(!lead){

        return;

    }

    localStorage.setItem(

        "selectedLead",

        JSON.stringify(lead)

    );

    location.href = "offers.html";

}

/* ==========================================
   Send Mail
========================================== */

function sendMail(id){

    const lead = leads.find(

        l => l.id == id

    );

    if(!lead){

        return;

    }

    localStorage.setItem(

        "selectedLead",

        JSON.stringify(lead)

    );

    location.href = "mail.html";

}

/* ==========================================
   Export CSV
========================================== */

function exportCSV(){

    let csv =

`Namn,Telefon,E-post,Ort,Status
`;

    leads.forEach(lead=>{

        csv +=

`${lead.name || ""},
${lead.phone || ""},
${lead.email || ""},
${lead.area || ""},
${lead.status || ""}
`;

    });

    const blob = new Blob(

        [csv],

        {

            type:"text/csv"

        }

    );

    const url =

        URL.createObjectURL(blob);

    const a =

        document.createElement("a");

    a.href = url;

    a.download =

        "leads.csv";

    a.click();

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

document

.getElementById("exportBtn")

.onclick = exportCSV;

document

.getElementById("offerBtn")

.onclick = ()=>{

    location.href="offers.html";

};

document

.getElementById("mailBtn")

.onclick = ()=>{

    location.href="mail.html";

};

/* ==========================================
   Auto Refresh
========================================== */

/* setInterval(loadLeads, 30000); */
