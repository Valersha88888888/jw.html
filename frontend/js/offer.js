document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("leadForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');

        const data = {
            serviceType: form.serviceType.value,
            otherService: form.otherService.value,
            size: form.size.value,
            squareMeters: form.squareMeters.value,
            area: form.area.value,
            otherArea: form.otherArea.value,
            name: form.name.value,
            phone: form.phone.value,
            email: form.email.value
        };

        try {
            submitButton.disabled = true;
            submitButton.textContent = "SKICKAR...";

            const response = await fetch("/api/public/leads", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Kunde inte skicka förfrågan."
                );
            }

            alert(
                result.message ||
                "Tack för din förfrågan! Vi kontaktar dig inom kort."
            );

            form.reset();
        } catch (error) {
            alert(
                error.message ||
                "Kunde inte ansluta till servern."
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "FÅ MIN GRATIS OFFERT";
        }
    });
});
