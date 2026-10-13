/* J&W Quality Hemservice - Public CRM contact form */
(function () {
  "use strict";

  const API_URL =
    "https://jw-quality-hemservice-crm.onrender.com/api/public/leads";

  const form = document.getElementById("contactForm");
  const status = document.getElementById("contact_status");

  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  let sending = false;

  function value(name) {
    return String(
      form.elements.namedItem(name)?.value || ""
    ).trim();
  }

  function showStatus(message, color) {
    if (!status) return;
    status.textContent = message;
    status.style.color = color;
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (sending) return;

    // Honeypot spam protection
    if (value("website")) return;

    // Validate required fields and consent
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const notes = [
      value("zip") ? "Postnummer: " + value("zip") : "",
      value("message") ? "Meddelande: " + value("message") : ""
    ].filter(Boolean).join("\n");

    const payload = {
      name: value("name"),
      phone: value("phone"),
      email: value("email"),
      serviceType: value("service"),
      area: value("city"),
      notes: notes
    };

    sending = true;
    if (submitButton) submitButton.disabled = true;

    showStatus("Skickar din förfrågan...", "#333");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "Kunde inte skicka förfrågan."
        );
      }

      showStatus(
        "Tack! Din förfrågan har skickats. Vi kontaktar dig snart.",
        "green"
      );

      form.reset();

    } catch (error) {
      console.error("CRM contact form error:", error);

      showStatus(
        "Något gick fel. Försök igen eller kontakta oss via telefon.",
        "red"
      );

    } finally {
      sending = false;
      if (submitButton) submitButton.disabled = false;
    }
  });
})();
