document.addEventListener("DOMContentLoaded", () => {
    const menuButton =
        document.getElementById("mobileMenuButton");

    const sidebar =
        document.getElementById("mainSidebar");

    const overlay =
        document.getElementById("mobileMenuOverlay");

    if (!menuButton || !sidebar || !overlay) {
        return;
    }

    const openMenu = () => {
        sidebar.classList.add("sidebar-open");
        overlay.classList.add("overlay-visible");
        document.body.classList.add("menu-open");

        menuButton.setAttribute(
            "aria-expanded",
            "true"
        );
    };

    const closeMenu = () => {
        sidebar.classList.remove("sidebar-open");
        overlay.classList.remove("overlay-visible");
        document.body.classList.remove("menu-open");

        menuButton.setAttribute(
            "aria-expanded",
            "false"
        );
    };

    menuButton.addEventListener("click", () => {
        const menuIsOpen =
            sidebar.classList.contains("sidebar-open");

        if (menuIsOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    overlay.addEventListener(
        "click",
        closeMenu
    );

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