(() => {
  const nav =
    document.getElementById("sidebarNavAuto") ||
    document.getElementById("sidebarNav");

  if (!nav) return;

  const MENU = [
    { href: "./catalogo-orquideas.html", icon: "fas fa-leaf", label: "Orquídeas" },
    { href: "./catalogo-plantas.html", icon: "fas fa-clover", label: "Plantas" },
    { href: "./catalogo-regalos.html", icon: "fas fa-gift", label: "Regalos" },
    { href: "./catalogo-peluches.html", icon: "fas fa-heart", label: "Peluches" },
    { href: "./catalogo-boxes.html", icon: "fas fa-box", label: "Boxes" },
    { href: "./catalogo-eventos.html", icon: "fas fa-calendar-check", label: "Eventos / Ocasiones" },
    { href: "./catalogo-condolencias.html", icon: "fas fa-dove", label: "Condolencias / En memoria" },
    { href: "./catalogo-varios.html", icon: "fas fa-ellipsis-h", label: "Varios" },
  ];

  const current = location.pathname.split("/").pop();

  nav.innerHTML = MENU.map(item => {
    const isActive = item.href.endsWith(current);
    return `
      <a href="${item.href}" class="sidebar-link-catalogo ${isActive ? "activa" : ""}">
        <i class="${item.icon}"></i>
        <span>${item.label}</span>
        <i class="fas fa-chevron-right"></i>
      </a>
    `;
  }).join("");
})();