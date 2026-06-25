// Detecta automáticamente si estás en local o en producción
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001'
  : window.location.origin;
const WHATSAPP_PHONE = "5491162948671";

function centsToPesos(cents) {
  return Math.round(Number(cents) / 100).toLocaleString("es-AR");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getImageUrl(p) {
  return p.image_url || p.imageUrl || "https://via.placeholder.com/400x400?text=Sin+Imagen";
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function inferDataCategoriaFromSubcategory(product) {
  const category = normalizeText(product?.category);
  const subcategory = normalizeText(product?.subcategory);

  if (!subcategory) return "";

  if (category === "flores y ramos") {
    if (subcategory === "ramos grandes") return "grandes";
    if (subcategory === "ramos medianos") return "medianos";
    if (subcategory === "ramos chicos") return "chicos";
    if (subcategory === "rosas importadas") return "importadas";
    if (subcategory === "rosas nacionales") return "nacionales";
  }

  if (category === "orquideas") {
    if (subcategory === "phalaenopsis" || subcategory === "orquideas phalaenopsis") return "phalaenopsis";
    if (subcategory === "cymbidium" || subcategory === "orquideas cymbidium") return "cybidium";
  }

  if (category === "plantas") {
    if (subcategory === "plantas interior" || subcategory === "interior") return "interior";
    if (subcategory === "plantas exterior" || subcategory === "exterior") return "exterior";
  }

  if (category === "peluches") {
    if (subcategory === "peluches grandes") return "grandes";
    if (subcategory === "peluches medianos") return "medianos";
    if (subcategory === "peluches chicos") return "chicos";
  }

  if (category === "eventos / ocasiones") {
    if (subcategory === "nacimiento") return "nacimiento";
    if (subcategory === "graduacion") return "graduacion";
    if (subcategory === "casamientos") return "casamientos";
    if (subcategory === "cumpleanos") return "cumpleanos";
    if (subcategory === "novias") return "novias";
  }

  return "";
}


function inferDataCategoriaFromSku(product) {
  const sku = String(product?.sku ?? "").toUpperCase();

  // Flores y Ramos
  if (sku.startsWith("RAM-GRA-")) return "grandes";
  if (sku.startsWith("RAM-MED-")) return "medianos";
  if (sku.startsWith("RAM-CHI-")) return "chicos";
  if (sku.startsWith("ROS-IMP-")) return "importadas";
  if (sku.startsWith("ROS-NAC-")) return "nacionales";

  // Orquídeas
  if (sku.startsWith("ORQ-PHA-")) return "phalaenopsis";
  if (sku.startsWith("ORQ-CYB-")) return "cybidium";

  // Plantas
  if (sku.startsWith("PLA-INT-")) return "interior";
  if (sku.startsWith("PLA-EXT-")) return "exterior";

  // Peluches
  if (sku.startsWith("PEL-GRA-")) return "grandes";
  if (sku.startsWith("PEL-MED-")) return "medianos";
  if (sku.startsWith("PEL-CHI-")) return "chicos";

  // Eventos
  if (sku.startsWith("EVE-NAC-")) return "nacimiento";
  if (sku.startsWith("EVE-GRA-")) return "graduacion";
  if (sku.startsWith("EVE-CAS-")) return "casamientos";
  if (sku.startsWith("EVE-CUM-")) return "cumpleanos";

  // Condolencias (si después definís prefijos, agregalos acá)
  // if (sku.startsWith("CON-...")) return "...";

  return "todas"; // fallback
}

function getProductFilterKey(product) {
  return inferDataCategoriaFromSubcategory(product) || inferDataCategoriaFromSku(product);
}

function matchesSubcategory(product, sub, subsub) {
  const normalizedSub = normalizeText(sub);
  const normalizedSubsub = normalizeText(subsub);
  const filterKey = getProductFilterKey(product);

  // Si no pidieron subcategoría, no filtramos
  if (!normalizedSub && !normalizedSubsub) return true;

  if (normalizedSub === "rosas") {
    if (normalizedSubsub === "importadas") return filterKey === "importadas";
    if (normalizedSubsub === "nacionales") return filterKey === "nacionales";
    return filterKey === "importadas" || filterKey === "nacionales";
  }

  const normalizedFilterMap = {
    "ramos grandes": "grandes",
    "ramos medianos": "medianos",
    "ramos chicos": "chicos",
    "orquideas phalaenopsis": "phalaenopsis",
    "orquideas cymbidium": "cybidium",
    "plantas interior": "interior",
    "plantas exterior": "exterior",
    "peluches grandes": "grandes",
    "peluches medianos": "medianos",
    "peluches chicos": "chicos",
    "importadas": "importadas",
    "nacionales": "nacionales",
    "interior": "interior",
    "exterior": "exterior",
    "grandes": "grandes",
    "medianos": "medianos",
    "chicos": "chicos",
    "phalaenopsis": "phalaenopsis",
    "cybidium": "cybidium",
    "nacimiento": "nacimiento",
    "graduacion": "graduacion",
    "casamientos": "casamientos",
    "cumpleanos": "cumpleanos",
    "novias": "novias",
  };

  const expectedKey =
    normalizedFilterMap[normalizedSubsub] ||
    normalizedFilterMap[normalizedSub] ||
    "";

  if (!expectedKey || expectedKey === "todas") return true;

  return filterKey === expectedKey;
}

function renderCard(p) {
 const id = encodeURIComponent(p._id || p.id);
  const name = escapeHtml(p.name);
  const price = centsToPesos(p.price_cents ?? 0);
  const img = getImageUrl(p);

  const waText = encodeURIComponent(
    `Hola! Quiero consultar sobre: ${p.name} (ID ${p.id}). Precio: $${centsToPesos(p.price_cents ?? 0)}`
  );
  const waHref = `https://wa.me/${WHATSAPP_PHONE}?text=${waText}`;

  // CLAVE: data-categoria para que funcionen tus botones (grandes/medianos/etc.)
  const dataCategoria = getProductFilterKey(p);

  return `
    <div class="catalogo-card" data-categoria="${escapeHtml(dataCategoria)}">
      <div class="catalogo-image">
        <img src="${img}" alt="${name}">
      </div>
      <h3>${name}</h3>
      <p class="price">$${price}</p>
      <div class="catalogo-buttons">
        <a class="btn btn-info" href="./productos/producto.html?id=${id}">
  Info
</a>
        <a class="btn btn-comprar" target="_blank" rel="noopener noreferrer" href="${waHref}">
          <i class="fab fa-whatsapp"></i> Comprar
        </a>
      </div>
    </div>
  `;
}

function applyInitialUiFilterIfAny() {
  
  const filter = window.CATALOGO_SUBCATEGORY_FILTER;
  if (!filter || filter === "todas") return;

  const cards = Array.from(document.querySelectorAll(".catalogo-card"));
  cards.forEach((card) => {
    card.style.display = card.getAttribute("data-categoria") === filter ? "flex" : "none";
  });
}

async function loadCatalog() {
  const grid = document.getElementById("catalogoGrid");
  if (!grid) return;

  const titleEl = document.getElementById("catalogoTitulo");
  const params = new URLSearchParams(window.location.search);

  // Las páginas setean esto:
  const category = window.CATALOGO_CATEGORY || params.get("category") || "";
  const subcategory = window.CATALOGO_SUBCATEGORY || params.get("subcategory") || "";
  const subsubcategory = window.CATALOGO_SUBSUBCATEGORY || params.get("subsubcategory") || "";

  if (titleEl) {
    const parts = [category, subcategory, subsubcategory].filter(Boolean);
    titleEl.textContent = parts.length ? parts.join(" / ") : "Nuestro Catálogo";
  }

  grid.innerHTML = `<div style="grid-column:1/-1;color:#6d6d6d;">Cargando...</div>`;

  try {
    // Traemos por category (backend)
    const qs = new URLSearchParams({
      page: "1",
      pageSize: "200",
      ...(category ? { category } : {}),
    });

    const res = await fetch(`${API_URL}/products?${qs.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Error cargando productos");

    let items = data.items || [];

    // Filtro “fuerte” por subcategory/subsubcategory cuando la página lo define
    if (subcategory || subsubcategory) {
      items = items.filter((p) => matchesSubcategory(p, subcategory, subsubcategory));
    }

    if (!items.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;color:#6d6d6d;">No hay productos para esta sección.</div>`;
      return;
    }

    grid.innerHTML = items.map(renderCard).join("");

    // Filtro UI (botones) si el usuario ya eligió algo antes de que termine de cargar
    applyInitialUiFilterIfAny();
  } catch (e) {
    grid.innerHTML = `<div style="grid-column:1/-1;color:#8b2e2e;">${escapeHtml(e.message)}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", loadCatalog);