const API_URL = "http://127.0.0.1:3001";
document.getElementById("apiUrlText").textContent = API_URL;

const els = {
  loginCard: document.getElementById("loginCard"),
  crudCard: document.getElementById("crudCard"),
  listCard: document.getElementById("listCard"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  loginBtn: document.getElementById("loginBtn"),
  loginMsg: document.getElementById("loginMsg"),
  logoutBtn: document.getElementById("logoutBtn"),

  productId: document.getElementById("productId"),
  name: document.getElementById("name"),
  sku: document.getElementById("sku"),
  price: document.getElementById("price"),
  stock: document.getElementById("stock"),
  status: document.getElementById("status"),
  category: document.getElementById("category"),
  imageUrl: document.getElementById("imageUrl"),

  // upload de imagen
  imageFile: document.getElementById("imageFile"),
  uploadBtn: document.getElementById("uploadBtn"),
  uploadMsg: document.getElementById("uploadMsg"),

  description: document.getElementById("description"),

  saveBtn: document.getElementById("saveBtn"),
  resetBtn: document.getElementById("resetBtn"),
  formMsg: document.getElementById("formMsg"),

  search: document.getElementById("search"),
  refreshBtn: document.getElementById("refreshBtn"),
  tbody: document.getElementById("tbody"),
  listMsg: document.getElementById("listMsg"),
};

function setMsg(el, msg) {
  if (!el) return;
  el.textContent = msg || "";
}

function setLoggedInUI(loggedIn) {
  els.loginCard.classList.toggle("hidden", loggedIn);
  els.crudCard.classList.toggle("hidden", !loggedIn);
  els.listCard.classList.toggle("hidden", !loggedIn);
}

function getToken() {
  return localStorage.getItem("admin_token");
}
function setToken(token) {
  localStorage.setItem("admin_token", token);
}
function clearToken() {
  localStorage.removeItem("admin_token");
}

async function api(path, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "Error");
  }
  return data;
}

// =============================
// NUEVO: Cargar el select de categorías
async function cargarCategoriasSelect() {
  if (!els.category) return;
  try {
    // Usa api para autenticar con el token de admin
    const cats = await api('/admin/categories');
    els.category.innerHTML = '<option value="">Elegí una categoría</option>';
    cats.forEach(cat => {
      const id = cat._id || cat.id;
    els.category.innerHTML += `<option value="${cat.slug}">${cat.name}</option>`;
    });
  } catch (e) {
    els.category.innerHTML = '<option value="">(Error al cargar categorías)</option>';
    setMsg(els.formMsg, 'No se pudieron cargar las categorías: ' + e.message);
  }
}
// =============================

async function uploadImage() {
  setMsg(els.uploadMsg, "Subiendo...");
  try {
    const file = els.imageFile?.files?.[0];
    if (!file) throw new Error("Elegí una imagen primero");

    const token = getToken();
    if (!token) throw new Error("No estás logueado");

    const fd = new FormData();
    fd.append("image", file);

    const res = await fetch(`${API_URL}/admin/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // NO setear Content-Type
      body: fd,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Error subiendo imagen");

    // Guardar y mostrar la URL (no se borra sola)
    const url = data.url || "";
    if (els.imageUrl) els.imageUrl.value = url;
    localStorage.setItem("last_uploaded_image_url", url);

    setMsg(els.uploadMsg, "Imagen subida OK.");
  } catch (e) {
    setMsg(els.uploadMsg, e.message);
  }
}

function pesosToCents(pesos) {
  // Permite que el input venga como "200000", "$200.000", "200.000", "200,000", etc.
  const cleaned = String(pesos ?? "")
    .replaceAll("$", "")
    .replaceAll(".", "")
    .replaceAll(",", "")
    .trim();

  const n = Number(cleaned);
  return Math.round(n * 100);
}

function centsToPesos(cents) {
  // Muestra pesos con separadores AR (ej: 200.000)
  return Math.round(Number(cents) / 100).toLocaleString("es-AR");
}

function resetForm() {
  els.productId.value = "";
  els.name.value = "";
  els.sku.value = "";
  els.price.value = "";
  els.stock.value = 0;
  els.status.value = "active";
  els.category.value = "";

  // IMPORTANTE: NO borrar imageUrl ni uploadMsg automáticamente
  // para que no "desaparezca" la URL después de subir.
  // els.imageUrl.value = "";
  // setMsg(els.uploadMsg, "");

  if (els.imageFile) els.imageFile.value = "";
  els.description.value = "";
  setMsg(els.formMsg, "");
}

async function login() {
  setMsg(els.loginMsg, "Entrando...");
  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: els.loginEmail.value.trim(),
        password: els.loginPassword.value,
      }),
    });
    setToken(data.token);
    setMsg(els.loginMsg, "");
    setLoggedInUI(true);
    await cargarCategoriasSelect(); // <- ¡Agregado aquí!
    await loadProducts();
  } catch (e) {
    setMsg(els.loginMsg, e.message);
  }
}

async function loadProducts() {
  setMsg(els.listMsg, "Cargando...");
  els.tbody.innerHTML = "";
  try {
    const search = els.search.value.trim();
    const qs = new URLSearchParams({
      page: "1",
      pageSize: "50",
      ...(search ? { search } : {}),
    });
    const data = await api(`/admin/products?${qs.toString()}`);
    renderProducts(data.items || []);
    setMsg(els.listMsg, `Total: ${data.pagination?.total ?? 0}`);
  } catch (e) {
    setMsg(els.listMsg, e.message);
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderProducts(items) {
  els.tbody.innerHTML = items
    .map(
      (p) => `
      <tr>
        <td>${p.id}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.sku)}</td>
        <td>$${centsToPesos(p.price_cents)}</td>
        <td>${p.stock}</td>
        <td>${p.status}</td>
        <td>
          <button class="btn-admin btn-ghost" data-action="edit" data-id="${p.id}">Editar</button>
          <button class="btn-admin btn-danger" data-action="archive" data-id="${p.id}">Archivar</button>
        </td>
      </tr>
    `
    )
    .join("");
}

async function saveProduct() {
  setMsg(els.formMsg, "Guardando...");
  try {
    const body = {
      name: els.name.value.trim(),
      sku: els.sku.value.trim(),

      // El input del admin es en PESOS → el backend guarda CENTAVOS
      priceCents: pesosToCents(els.price.value),

      stock: Number(els.stock.value || 0),
      status: els.status.value,
      category: els.category.value.trim() || null,
      imageUrl: els.imageUrl.value.trim() || null,
      description: els.description.value.trim() || null,
    };

    if (!body.name || !body.sku || Number.isNaN(body.priceCents)) {
      throw new Error("Faltan datos (name, sku, price)");
    }

    const id = els.productId.value;
    if (id) {
      await api(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(body) });
    } else {
      await api(`/admin/products`, { method: "POST", body: JSON.stringify(body) });
    }

    setMsg(els.formMsg, "Listo.");
    resetForm();
    await loadProducts();
  } catch (e) {
    setMsg(els.formMsg, e.message);
  }
}

function parsePriceCellToPesoNumber(text) {
  // Convierte "$200.000" → "200000" → 200000
  return String(text ?? "")
    .replaceAll("$", "")
    .replaceAll(".", "")
    .replaceAll(",", "")
    .trim();
}

function fillFormFromRow(row) {
  const tds = row.querySelectorAll("td");
  els.productId.value = tds[0].textContent;
  els.name.value = tds[1].textContent;
  els.sku.value = tds[2].textContent;

  // Antes: els.price.value = "...".replace("$","")
  // Ahora: soporta separadores de miles (200.000) sin romper el número
  els.price.value = parsePriceCellToPesoNumber(tds[3].textContent || "");

  els.stock.value = tds[4].textContent;
  els.status.value = tds[5].textContent;

  // No podemos reconstruir el archivo del input type=file (por seguridad del navegador)
  if (els.imageFile) els.imageFile.value = "";

  // IMPORTANTE: NO borrar el uploadMsg automáticamente, así no desaparece “Imagen subida OK.”
  // setMsg(els.uploadMsg, "");

  setMsg(els.formMsg, "Editando: tocá Guardar para actualizar.");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function archiveProduct(id) {
  if (!confirm("¿Seguro que querés archivar este producto?")) return;
  setMsg(els.listMsg, "Archivando...");
  try {
    await api(`/admin/products/${id}`, { method: "DELETE" });
    await loadProducts();
  } catch (e) {
    setMsg(els.listMsg, e.message);
  }
}

function init() {
  els.loginBtn.addEventListener("click", login);
  els.logoutBtn.addEventListener("click", () => {
    clearToken();
    setLoggedInUI(false);
    resetForm();
    setMsg(els.loginMsg, "Sesión cerrada.");
  });

  els.refreshBtn.addEventListener("click", loadProducts);
  els.search.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loadProducts();
  });

  els.saveBtn.addEventListener("click", saveProduct);
  els.resetBtn.addEventListener("click", resetForm);

  if (els.uploadBtn) {
    els.uploadBtn.addEventListener("click", uploadImage);
  }

  els.tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const action = btn.dataset.action;
    const row = btn.closest("tr");
    if (action === "edit") fillFormFromRow(row);
    if (action === "archive") archiveProduct(btn.dataset.id);
  });

  // Restaurar última URL subida (por si el navegador recarga o algo limpia el input)
  const last = localStorage.getItem("last_uploaded_image_url");
  if (last && els.imageUrl && !els.imageUrl.value) {
    els.imageUrl.value = last;
  }

  if (getToken()) {
    setLoggedInUI(true);
    cargarCategoriasSelect(); // <- también acá
    loadProducts().catch(() => setLoggedInUI(false));
  } else {
    setLoggedInUI(false);
  }
}

init();