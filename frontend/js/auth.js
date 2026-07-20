const API = "http://localhost:3000/api";

const form = document.getElementById("loginForm");

const error = document.getElementById("error");

form.addEventListener("submit", login);

async function login(e) {

    e.preventDefault();

    error.textContent = "";

    const email = document
        .getElementById("email")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;

    try {

        const response = await fetch(

            `${API}/auth/login`,

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    email,

                    password

                })

            }

        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(

                data.message ||

                "Login failed"

            );

        }

        localStorage.setItem(

            "token",

            data.token

        );

        localStorage.setItem(

            "user",

            JSON.stringify(data.user)

        );

        window.location.href =

            "dashboard.html";

    }

    catch (err) {

        error.textContent =

            err.message;

    }

}
