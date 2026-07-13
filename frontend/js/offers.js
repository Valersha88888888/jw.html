/* ==========================================
   J&W Quality Hemservice CRM
   Offers Module
========================================== */


let offers = [];

let filteredOffers = [];

let editingOffer = null;

document.addEventListener(

    "DOMContentLoaded",

    initializeOffers

);

/* ==========================================
   Init
========================================== */

async function initializeOffers(){

    checkLogin();

    setupEvents();

    await loadOffers();

}

/* ==========================================
   Login
========================================== */

function checkLogin(){

    const token = localStorage.getItem("token");

    if(!token){

        location.href="login.html";

        return;

    }

    const user = JSON.parse(

        localStorage.getItem("user") || "{}"

    );

    const userBox =

        document.getElementById("userName");

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

        filterOffers

    );

    document

    .getElementById("statusFilter")

    .addEventListener(

        "change",

        filterOffers

    );

    document

    .getElementById("newOfferBtn")

    .onclick = openNewOffer;

    document

    .getElementById("cancelOffer")

    .onclick = closeModal;

    document

    .getElementById("offerForm")

    .onsubmit = saveOffer;

    document

    .getElementById("previewOffer")

    .onclick = previewOffer;

}

/* ==========================================
   Logout
========================================== */

function logout(){

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    location.href="login.html";

}

/* ==========================================
   Load Offers
========================================== */

async function loadOffers(){



    try{

        const token =

            localStorage.getItem("token");

        const response =

            await fetch(

                `${API_URL}/offers`,

                {

                    headers:{

                        Authorization:

                        `Bearer ${token}`

                    }

                }

            );

        offers =

            await response.json();

        filteredOffers =

            [...offers];

        renderOffers();

        updateStatistics();



    }

    catch(error){

        console.error(error);



        showToast(

            "Kunde inte lÃ¤sa offerter",

            "error"

        );

    }

}
/* ==========================================
   Render Offers
========================================== */

function renderOffers(){

    const tbody =

        document.getElementById(

            "offerTable"

        );

    tbody.innerHTML = "";

    if(filteredOffers.length===0){

        tbody.innerHTML = `

        <tr>

            <td colspan="7">

                Inga offerter hittades

            </td>

        </tr>

        `;

        return;

    }

    filteredOffers

    .slice()

    .reverse()

    .forEach(offer=>{

        const tr =

            document.createElement("tr");

        tr.innerHTML = `

        <td>

            ${offer.offerNumber||""}

        </td>

        <td>

            ${escapeHtml(

                offer.customerName||""

            )}

        </td>

        <td>

            ${escapeHtml(

                offer.customerPhone||""

            )}

        </td>

        <td>

            ${formatDate(

                offer.createdAt

            )}

        </td>

        <td>

            ${formatMoney(

                offer.price

            )}

        </td>

        <td>

            ${renderStatus(

                offer.status||"Utkast"

            )}

        </td>

        <td>

            <div class="action-buttons">

                <button

                    class="view-btn"

                    onclick="viewOffer(${offer.id})"

                    title="Visa">

                    ðŸ‘

                </button>

                <button

                    class="edit-btn"

                    onclick="editOffer(${offer.id})"

                    title="Redigera">

                    âœï¸

                </button>

                <button

                    class="pdf-btn"

                    onclick="downloadPDF(${offer.id})"

                    title="PDF">

                    ðŸ“„

                </button>

                <button

                    class="mail-btn"

                    onclick="sendOffer(${offer.id})"

                    title="Mail">

                    ðŸ“§

                </button>

                <button

                    class="delete-btn"

                    onclick="deleteOffer(${offer.id})"

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

        case "Utkast":

            return '<span class="status status-draft">Utkast</span>';

        case "Skickad":

            return '<span class="status status-sent">Skickad</span>';

        case "GodkÃ¤nd":

            return '<span class="status status-approved">GodkÃ¤nd</span>';

        case "Nekad":

            return '<span class="status status-rejected">Nekad</span>';

        default:

            return status;

    }

}

/* ==========================================
   Statistics
========================================== */

function updateStatistics(){

    document

    .getElementById("offerCount")

    .textContent =

        offers.length;

    document

    .getElementById("sentCount")

    .textContent =

        offers.filter(

            o=>o.status==="Skickad"

        ).length;

    document

    .getElementById("acceptedCount")

    .textContent =

        offers.filter(

            o=>o.status==="GodkÃ¤nd"

        ).length;

    const total =

        offers.reduce(

            (sum,o)=>

            sum+

            Number(o.price||0),

            0

        );

    document

    .getElementById("offerValue")

    .textContent =

        formatMoney(total);

}

/* ==========================================
   Search + Filter
========================================== */

function filterOffers(){

    const search =

        document

        .getElementById("searchInput")

        .value

        .toLowerCase();

    const status =

        document

        .getElementById("statusFilter")

        .value;

    filteredOffers =

        offers.filter(offer=>{

            const matchSearch =

            (offer.customerName||"")

            .toLowerCase()

            .includes(search)

            ||

            (offer.customerPhone||"")

            .toLowerCase()

            .includes(search)

            ||

            (offer.offerNumber||"")

            .toLowerCase()

            .includes(search);

            const matchStatus =

                status===""

                ||

                offer.status===status;

            return(

                matchSearch

                &&

                matchStatus

            );

        });

    renderOffers();

}
/* ==========================================
   Modal
========================================== */

function openNewOffer(){

    editingOffer = null;

    document

    .getElementById("offerForm")

    .reset();

    document

    .getElementById("modalTitle")

    .textContent="Ny Offert";

    document

    .getElementById("offerModal")

    .classList.add("active");

}

function closeModal(){

    document

    .getElementById("offerModal")

    .classList.remove("active");

}

/* ==========================================
   Edit Offer
========================================== */

function editOffer(id){

    editingOffer=

        offers.find(

            o=>o.id==id

        );

    if(!editingOffer){

        return;

    }

    document.getElementById("modalTitle")

    .textContent="Redigera Offert";

    document.getElementById("customerName")

    .value=

        editingOffer.customerName||"";

    document.getElementById("customerPhone")

    .value=

        editingOffer.customerPhone||"";

    document.getElementById("customerEmail")

    .value=

        editingOffer.customerEmail||"";

    document.getElementById("customerAddress")

    .value=

        editingOffer.customerAddress||"";

    document.getElementById("service")

    .value=

        editingOffer.service||"";

    document.getElementById("price")

    .value=

        editingOffer.price||0;

    document.getElementById("rot")

    .value=

        editingOffer.rot||0;

    document.getElementById("vat")

    .value=

        editingOffer.vat||25;

    document.getElementById("offerStatus")

    .value=

        editingOffer.status||"Utkast";

    document.getElementById("notes")

    .value=

        editingOffer.notes||"";

    document

    .getElementById("offerModal")

    .classList.add("active");

}

/* ==========================================
   Save Offer
========================================== */

async function saveOffer(e){

    e.preventDefault();

    const token=

        localStorage.getItem("token");

    const offer={

        customerName:

            customerName.value,

        customerPhone:

            customerPhone.value,

        customerEmail:

            customerEmail.value,

        customerAddress:

            customerAddress.value,

        service:

            service.value,

        price:

            Number(price.value),

        rot:

            Number(rot.value),

        vat:

            Number(vat.value),

        notes:

            notes.value,

        status:

            offerStatus.value

    };

    try{

        if(editingOffer){

            await fetch(

                `${API_URL}/offers/${editingOffer.id}`,

                {

                    method:"PUT",

                    headers:{

                        "Content-Type":"application/json",

                        Authorization:

                        `Bearer ${token}`

                    },

                    body:JSON.stringify(offer)

                }

            );

        }

        else{

            await fetch(

                `${API_URL}/offers`,

                {

                    method:"POST",

                    headers:{

                        "Content-Type":"application/json",

                        Authorization:

                        `Bearer ${token}`

                    },

                    body:JSON.stringify(offer)

                }

            );

        }

        closeModal();

        await loadOffers();

        showToast(

            "Offert sparad"

        );

    }

    catch(err){

        console.error(err);

        showToast(

            "Kunde inte spara",

            "error"

        );

    }

}
/* ==========================================
   Delete Offer
========================================== */

async function deleteOffer(id){

    if(!confirm("Vill du ta bort denna offert?")){

        return;

    }

    try{

        const token =

            localStorage.getItem("token");

        await fetch(

            `${API_URL}/offers/${id}`,

            {

                method:"DELETE",

                headers:{

                    Authorization:

                    `Bearer ${token}`

                }

            }

        );

        showToast(

            "Offerten borttagen"

        );

        await loadOffers();

    }

    catch(error){

        console.error(error);

        showToast(

            "Kunde inte ta bort offerten",

            "error"

        );

    }

}

/* ==========================================
   Preview PDF
========================================== */

function previewOffer(){

    showToast(

        "PDF-fÃ¶rhandsvisning kommer i nÃ¤sta steg"

    );

}

/* ==========================================
   Download PDF
========================================== */

function downloadPDF(id){

    const offer = offers.find(

        o => o.id == id

    );

    if(!offer){

        return;

    }

    window.open(

        `${API_URL}/offers/${offer.offerNumber}.pdf`,

        "_blank"

    );

}

/* ==========================================
   Send Offer
========================================== */

async function sendOffer(id){

    const offer = offers.find(

        o => o.id == id

    );

    if(!offer){

        return;

    }

    showToast(

        "Skickar offert..."

    );

    try{

        const token =

            localStorage.getItem("token");

        await fetch(

            `${API_URL}/send-email`,

            {

                method:"POST",

                headers:{

                    "Content-Type":"application/json",

                    Authorization:

                    `Bearer ${token}`

                },

                body:JSON.stringify({

                    to:offer.customerEmail,

                    subject:`Offert ${offer.offerNumber}`,

                    message:

`Hej ${offer.customerName},

Tack fÃ¶r ert intresse.

Er offert finns bifogad.

Med vÃ¤nliga hÃ¤lsningar

J&W Quality Hemservice`

                })

            }

        );

        showToast(

            "Offerten skickades"

        );

    }

    catch(error){

        console.error(error);

        showToast(

            "Kunde inte skicka e-post",

            "error"

        );

    }

}

/* ==========================================
   View Offer
========================================== */

function viewOffer(id){

    const offer = offers.find(

        o => o.id == id

    );

    if(!offer){

        return;

    }

    alert(

`Offertnummer: ${offer.offerNumber}

Kund: ${offer.customerName}

Telefon: ${offer.customerPhone}

E-post: ${offer.customerEmail}

Pris: ${formatMoney(offer.price)}

Status: ${offer.status}`

    );

}

/* ==========================================
   Helpers
========================================== */

function formatMoney(value){

    return Number(

        value || 0

    ).toLocaleString(

        "sv-SE",

        {

            style:"currency",

            currency:"SEK"

        }

    );

}

function formatDate(date){

    if(!date){

        return "";

    }

    return new Date(

        date

    ).toLocaleDateString(

        "sv-SE"

    );

}

function escapeHtml(text){

    const div =

        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}

/* ==========================================
   Auto Refresh
========================================== */

/* setInterval(loadOffers, 30000); */
