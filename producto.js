// Detecta automáticamente si estás en local o en producción
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001'
  : window.location.origin;
const WHATSAPP_PHONE = "5491162948671";

function setText(el, value) {
  if (!el) return;
  el.textContent = value == null ? "" : String(value);
}

function setListHtml(el, html) {
  if (!el) return;
  el.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", async () => {
  const id = new URLSearchParams(window.location.search).get("id");

  // Elementos DOM
  const nameH1      = document.getElementById("productoNombre");
  const titleH2     = document.getElementById("productoTitulo");
  const priceSpan   = document.getElementById("productoPrecio");
  const descP       = document.getElementById("productoDescripcion");
  const img         = document.getElementById("productoImagen");
  const categoryBadge = document.getElementById("productoCategoriaBadge");
  const detailsUl   = document.getElementById("productoDetalles");
  const buyBtn      = document.getElementById("btnComprarProducto");

  if (!id) {
    setText(nameH1, "Producto no encontrado");
    setText(titleH2, "Falta ?id en la URL");
    setText(descP, "Abrí el producto desde el catálogo (botón Info).");
    setListHtml(detailsUl, "<li>Falta ?id</li>");
    setText(priceSpan, "-");
    setText(categoryBadge, "-");
    if (img) img.src = "https://via.placeholder.com/400x400?text=Sin+Imagen";
    if (buyBtn) buyBtn.style.display = "none";
    return;
  }

  setText(titleH2, "Cargando...");
  setListHtml(detailsUl, "<li>Cargando...</li>");

  try {
    const url = `${API_URL}/products/${encodeURIComponent(id)}`;

    const res = await fetch(url);

    const p = await res.json().catch(err => {
      console.error("[Producto] Error parseando JSON:", err);
      return null;
    });

    if (!res.ok || !p) throw new Error(p?.error || "No se pudo cargar el producto.");

    // MOSTRAR DATOS EN PANTALLA
    setText(nameH1, p.name || "Producto");
    setText(titleH2, p.name || "Producto");
    setText(priceSpan, p.price_cents ? Math.round(p.price_cents / 100).toLocaleString("es-AR") : (p.priceARS || "Consultar"));
    setText(descP, p.description || "Sin descripción.");
    setText(categoryBadge, p.category || "-");
    if (img) {
      img.src = p.image_url || p.imageUrl || "https://via.placeholder.com/400x400?text=Sin+Imagen";
      img.alt = p.name || "Producto";
    }
    if (buyBtn) {
      buyBtn.href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(`Hola, me interesa *${p.name ?? ""}*`)}`;
      buyBtn.style.display = "";
    }

    // Detalles/características
    if (Array.isArray(p.details) && p.details.length) {
      setListHtml(detailsUl, p.details.map(d => `<li>${d}</li>`).join(""));
    } else if (typeof p.caracteristicas === "string" && p.caracteristicas.trim()) {
      setListHtml(detailsUl, `<li>${p.caracteristicas}</li>`);
    } else {
      setListHtml(detailsUl, `
        <li><strong>SKU:</strong> ${p.sku ?? "-"}</li>
        <li><strong>Stock:</strong> ${p.stock ?? "-"}</li>
        <li><strong>Estado:</strong> ${p.status ?? "-"}</li>
      `);
    }
  } catch (e) {
    console.error("[Producto] ERROR:", e);
    setText(nameH1, "Producto no encontrado");
    setText(titleH2, "No se pudo cargar");
    setText(descP, "No pudimos cargar la info. El producto no existe o fue eliminado.");
    setText(priceSpan, "-");
    setText(categoryBadge, "-");
    setListHtml(detailsUl, "<li>No hay detalles disponibles.</li>");
    if (img) img.src = "https://via.placeholder.com/400x400?text=Sin+Imagen";
    if (buyBtn) buyBtn.style.display = "none";
  }
});