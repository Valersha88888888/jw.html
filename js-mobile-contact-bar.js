/* J&W Quality Hemservice - Mobile contact bar */
(function () {
  "use strict";

  if (document.querySelector(".jw-mobile-contact")) return;

  const bar = document.createElement("nav");
  bar.className = "jw-mobile-contact";
  bar.setAttribute("aria-label", "Snabbkontakt");

  bar.innerHTML = `
    <a href="tel:+46700433157" aria-label="Ring J&W Quality Hemservice">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.1 5.2 2 2 0 0 1 5.1 3h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.7L8.1 11a16 16 0 0 0 4.9 4.9l1.6-1.9a2 2 0 0 1 1.7-.6l3 .5a2 2 0 0 1 1.7 1.9Z"/>
      </svg>
      <span>Ring oss</span>
    </a>

    <a href="mailto:jw.qualityhemservice@gmail.com?subject=F%C3%B6rfr%C3%A5gan%20-%20J%26W%20Quality%20Hemservice" aria-label="Skicka e-post till J&W Quality Hemservice">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="m2 6 10 7 10-7"/>
      </svg>
      <span>E-post</span>
    </a>

    <a class="jw-mobile-offer" href="kontakt.html#contactForm" aria-label="Få en offert">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 3h8l4 4v14H4V3h4Z"/>
        <path d="M16 3v5h4M8 12h8M8 16h6"/>
      </svg>
      <span>Få offert</span>
    </a>
  `;

  document.body.appendChild(bar);

  const offer = bar.querySelector(".jw-mobile-offer");
  offer.addEventListener("click", function (event) {
    const form = document.getElementById("contactForm");
    if (!form) return;

    event.preventDefault();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
