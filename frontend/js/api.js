const API_URL = "https://jw-quality-hemservice-crm.onrender.com/api";


function getToken() {
    return localStorage.getItem("token");
}

function getHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
    };
}


async function apiGet(endpoint) {



    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            headers: getHeaders()
        }
    );

    if (!response.ok) {
        throw new Error(await response.text());
    }

    return response.json();
}

async function apiPost(endpoint, data) {



    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data)
        }
    );

    if (!response.ok) {
        throw new Error(await response.text());
    }

    return response.json();
}

async function apiPut(endpoint, data) {

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data)
        }
    );

    if (!response.ok) {
        throw new Error(await response.text());
    }

    return response.json();
}

async function apiDelete(endpoint) {

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            method: "DELETE",
            headers: getHeaders()
        }
    );

    if (!response.ok) {
        throw new Error(await response.text());
    }

    return response.json();
}

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";

}
}
