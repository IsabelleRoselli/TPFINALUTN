// Detecta automáticamente si estás en local o en producción
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001'
  : window.location.origin;
const WHATSAPP_PHONE = "5491162948671";

document.addEventListener("DOMContentLoaded", async () => {
  const id = new URLSearchParams(window.location.search).get("id");

  // Elementos DOM
  const nameH1      = document.getElementById("productoNombre");
  const titleH2     = document.getElementById("productoTitulo");
  const priceSpan   = document.getElementById("productoPrecio");
  const descP       = document.getElementById("productoDescripcion");
  const img         = document.getElementById("productoImagen");
  const categorySpan= document.getElementById("productoCategoriaBadge");
  const detailsUl   = document.getElementById("productoDetalles");
  const buyBtn      = document.getElementById("btnComprarProducto");

  if (!id) {
    nameH1.textContent    = "Producto no encontrado";
    titleH2.textContent   = "Falta ?id en la URL";
    descP.textContent     = "Abrí el producto desde el catálogo (botón Info).";
    detailsUl.innerHTML   = "<li>Falta ?id</li>";
    img.src               = "https://via.placeholder.com/400x400?text=Sin+Imagen";
    priceSpan.textContent = "-";
    categorySpan.textContent = "-";
    buyBtn.style.display  = "none";
    return;
  }

  titleH2.textContent   = "Cargando...";
  detailsUl.innerHTML   = "<li>Cargando...</li>";

  try {
    const url = `${API_URL}/products/${encodeURIComponent(id)}`;

    const res = await fetch(url);

    const p = await res.json().catch(err => {
      console.error("[Producto] Error parseando JSON:", err);
      return null;
    });

    if (!res.ok || !p) throw new Error(p?.error || "No se pudo cargar el producto.");

    // MOSTRAR DATOS EN PANTALLA
    nameH1.textContent        = p.name || "Producto";
    titleH2.textContent       = p.name || "Producto";
    priceSpan.textContent     = p.price_cents ? Math.round(p.price_cents / 100).toLocaleString("es-AR") : (p.priceARS || "Consultar");
    descP.textContent         = p.description || "Sin descripción.";
    categorySpan.textContent  = p.category || "-";
    img.src                   = p.image_url || p.imageUrl || "https://via.placeholder.com/400x400?text=Sin+Imagen";
    img.alt                   = p.name || "Producto";
    buyBtn.href               = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(`Hola, me interesa *${p.name ?? ""}*`)}`;

    // Detalles/características
    if (Array.isArray(p.details) && p.details.length) {
      detailsUl.innerHTML = p.details.map(d => `<li>${d}</li>`).join("");
    } else if (typeof p.caracteristicas === "string" && p.caracteristicas.trim()) {
      detailsUl.innerHTML = `<li>${p.caracteristicas}</li>`;
    } else {
      detailsUl.innerHTML = `
        <li><strong>SKU:</strong> ${p.sku ?? "-"}</li>
        <li><strong>Stock:</strong> ${p.stock ?? "-"}</li>
        <li><strong>Estado:</strong> ${p.status ?? "-"}</li>
      `;
    }
  } catch (e) {
    console.error("[Producto] ERROR:", e);
    nameH1.textContent        = "Producto no encontrado";
    titleH2.textContent       = "No se pudo cargar";
    descP.textContent         = "No pudimos cargar la info. El producto no existe o fue eliminado.";
    img.src                   = "https://via.placeholder.com/400x400?text=Sin+Imagen";
    priceSpan.textContent     = "-";
    detailsUl.innerHTML       = "<li>No hay detalles disponibles.</li>";
    categorySpan.textContent  = "-";
    buyBtn.style.display      = "none";
  }
});