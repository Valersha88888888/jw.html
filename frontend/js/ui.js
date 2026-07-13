function showToast(message, type = "success") {

    let toast = document.getElementById("toast");

    if (!toast) {

        toast = document.createElement("div");

        toast.id = "toast";

        document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.className = `toast ${type} show`;

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}

function showLoader() {

    let loader = document.getElementById("loader");

    if (!loader) {

        loader = document.createElement("div");

        loader.id = "loader";

        loader.innerHTML = `
            <div class="spinner"></div>
        `;

        document.body.appendChild(loader);

    }

    loader.style.display = "flex";

}

function hideLoader() {

    const loader = document.getElementById("loader");

    if (loader) {

        loader.style.display = "none";

    }

}

function confirmDialog(message) {

    return window.confirm(message);

}

function formatDate(date) {

    return new Date(date).toLocaleDateString(

        "sv-SE",

        {

            year: "numeric",

            month: "2-digit",

            day: "2-digit"

        }

    );

}

function formatPhone(phone) {

    if (!phone) {

        return "";

    }

    return phone;

}

function escapeHtml(text) {

    const div = document.createElement("div");

    div.innerText = text;

    return div.innerHTML;

}