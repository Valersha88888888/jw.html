document.addEventListener("DOMContentLoaded", () => {
    const button =
        document.getElementById("mobileMenuButton");

    const sidebar =
        document.getElementById("mainSidebar");

    const overlay =
        document.getElementById("mobileMenuOverlay");

    if (!button || !sidebar || !overlay) {
        return;
    }

    const openMenu = () => {
        sidebar.classList.add("crm-sidebar-open");
        overlay.classList.add("crm-overlay-visible");
        document.body.classList.add("crm-menu-open");

        button.setAttribute(
            "aria-expanded",
            "true"
        );
    };

    const closeMenu = () => {
        sidebar.classList.remove("crm-sidebar-open");
        overlay.classList.remove("crm-overlay-visible");
        document.body.classList.remove("crm-menu-open");

        button.setAttribute(
            "aria-expanded",
            "false"
        );
    };

    button.addEventListener("click", () => {
        if (
            sidebar.classList.contains(
                "crm-sidebar-open"
            )
        ) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    overlay.addEventListener("click", closeMenu);

    sidebar
        .querySelectorAll("a")
        .forEach((link) => {
            link.addEventListener(
                "click",
                closeMenu
            );
        });

    document.addEventListener(
        "keydown",
        (event) => {
            if (event.key === "Escape") {
                closeMenu();
            }
        }
    );

    window.addEventListener(
        "resize",
        () => {
            if (window.innerWidth > 800) {
                closeMenu();
            }
        }
    );
});
