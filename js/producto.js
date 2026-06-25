// Detecta automáticamente si estás en local o en producción
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001'
  : window.location.origin;
const WHATSAPP_PHONE = "5491162948671";

function centsToPesos(cents) {
  return (Number(cents) / 100).toFixed(0);
}

function safeText(el, text) {
  if (!el) return;
  el.textContent = text == null ? "" : String(text);
}

function setListItems(ul, items) {
  if (!ul) return;
  ul.innerHTML = "";

  if (!items || !items.length) {
    ul.innerHTML = "<li>Sin características.</li>";
    return;
  }

  ul.innerHTML = items.map((x) => `<li>${escapeHtml(x)}</li>`).join("");
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

// Si en tu DB no tenés “características” separadas,
// generamos una lista útil con lo que sí existe.
function buildFeatures(p) {
  const feats = [];

  if (p.stock != null) feats.push(`Stock: ${p.stock}`);
  if (p.sku) feats.push(`SKU: ${p.sku}`);
  if (p.category) feats.push(`Categoría: ${p.category}`);

  return feats;
}

async function loadProduct() {
  const nameH1 = document.getElementById("productoNombre");
  const titleH2 = document.getElementById("productoTitulo");
  const priceSpan = document.getElementById("productoPrecio");
  const descP = document.getElementById("productoDescripcion");
  const img = document.getElementById("productoImagen");
  const detailsUl = document.getElementById("productoDetalles");
  const categorySpan = document.getElementById("productoCategoria");
  const categoriaBadge = document.getElementById("productoCategoriaBadge");
  const buyBtn = document.getElementById("btnComprarProducto");

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    safeText(nameH1, "Producto no encontrado");
    safeText(titleH2, "Falta el parámetro ?id");
    safeText(priceSpan, "");
    safeText(descP, "Volvé al catálogo y elegí un producto.");
    if (detailsUl) detailsUl.innerHTML = "<li>Falta el parámetro ?id</li>";
    if (buyBtn) buyBtn.href = `https://wa.me/${WHATSAPP_PHONE}`;
    return;
  }

  safeText(titleH2, "Cargando...");
  if (detailsUl) detailsUl.innerHTML = "<li>Cargando características...</li>";

  try {
    const res = await fetch(`${API_URL}/products/${encodeURIComponent(id)}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo cargar el producto");
    }

    // Render
    const p = data;

    safeText(nameH1, p.name || "Producto");
    safeText(titleH2, p.name || "Producto");
    safeText(priceSpan, centsToPesos(p.price_cents ?? 0));
    safeText(descP, p.description || "Sin descripción.");
    safeText(categorySpan, p.category || "-");
    safeText(categoriaBadge, p.category || "");

    if (img) {
      img.src = getImageUrl(p);
      img.alt = p.name || "Producto";
    }

    setListItems(detailsUl, buildFeatures(p));

    // Botón WhatsApp
    const waText = encodeURIComponent(`Hola, me interesa *${p.name}*`);
    if (buyBtn) buyBtn.href = `https://wa.me/${WHATSAPP_PHONE}?text=${waText}`;
  } catch (e) {
    safeText(nameH1, "Producto no encontrado");
    safeText(titleH2, "Error");
    safeText(descP, e.message);
    if (detailsUl) detailsUl.innerHTML = `<li>${escapeHtml(e.message)}</li>`;
    if (buyBtn) buyBtn.href = `https://wa.me/${WHATSAPP_PHONE}`;
  }
}

loadProduct();