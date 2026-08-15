const API_URL = "http://127.0.0.1:3001";
const WHATSAPP_PHONE = "5491162948671";

function centsToPesos(cents) {
  return (Number(cents) / 100).toFixed(0);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function imageUrl(p) {
  return p.image_url || p.imageUrl || "";
}

// Subcategoría: por ahora se infiere del SKU.
function inferSubcategoryFromSku(skuRaw) {
  const sku = String(skuRaw || "").toUpperCase();

  if (sku.includes("IMP")) return "importadas";
  if (sku.includes("NAC")) return "nacionales";
  if (sku.includes("GRA")) return "grandes";
  if (sku.includes("MED")) return "medianos";
  if (sku.includes("CHI")) return "chicos";

  return "todas";
}

function renderCard(p) {
  const id = encodeURIComponent(p.id);
  const name = escapeHtml(p.name);
  const price = `$${centsToPesos(p.price_cents)}`;
  const img = imageUrl(p) || "https://via.placeholder.com/250x250?text=Sin+Imagen";
  const subcat = inferSubcategoryFromSku(p.sku);

  // Construir URL del producto
  const productPageUrl = `${window.location.origin}/pages/productos/producto.html?id=${id}`;
  
  // Mensaje de WhatsApp con nombre del producto y URL
  const waText = encodeURIComponent(`Hola, me interesa *${p.name}*\n${productPageUrl}`);
  const waHref = `https://wa.me/${WHATSAPP_PHONE}?text=${waText}`;

  return `
    <div class="catalogo-card" data-categoria="${subcat}">
      <div class="catalogo-image">
        <img src="${img}" alt="${name}">
      </div>
      <h3>${name}</h3>
      <p class="price">${price}</p>
      <div class="catalogo-buttons">
        <a href="./productos/producto.html?id=${id}" class="btn btn-info">
          <i class="fas fa-info-circle"></i> Info
        </a>
        <a href="${waHref}" target="_blank" rel="noopener noreferrer" class="btn btn-comprar">
          <i class="fab fa-whatsapp"></i> Comprar
        </a>
      </div>
    </div>
  `;
}

async function loadCatalog() {
  const grid = document.getElementById("catalogoGrid");
  if (!grid) return;

  grid.innerHTML = `<div style="grid-column:1/-1;color:#6d6d6d;">Cargando productos...</div>`;

  try {
    const qs = new URLSearchParams({
      page: "1",
      pageSize: "200",
      category: "Flores y Ramos",
    });

    const res = await fetch(`${API_URL}/products?${qs.toString()}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data?.error || "No se pudieron cargar los productos.");

    const items = data.items || [];
    if (!items.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;color:#6d6d6d;">No hay productos cargados en Flores y Ramos.</div>`;
      return;
    }

    grid.innerHTML = items.map(renderCard).join("");
  } catch (e) {
    grid.innerHTML = `<div style="grid-column:1/-1;color:#8b2e2e;">${escapeHtml(e.message)}</div>`;
  }
}

loadCatalog();
