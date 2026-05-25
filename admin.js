// Detecta automáticamente si estás en local o en producción
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001'
  : window.location.origin;

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const loginScreen = document.getElementById("loginScreen");
const adminScreen = document.getElementById("adminScreen");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginMsg = document.getElementById("loginMsg");

const productForm = document.getElementById("productForm");
const productId = document.getElementById("productId");
const productName = document.getElementById("productName");
const productSku = document.getElementById("productSku");  // ✓ Minúscula al final
const productPrice = document.getElementById("productPrice");
const productStock = document.getElementById("productStock");
const productCategory = document.getElementById("productCategory");
const productSubcategory = document.getElementById("productSubcategory");
const productImage = document.getElementById("productImage");
const productDescription = document.getElementById("productDescription");

const formMsg = document.getElementById("formMsg");
const uploadMsg = document.getElementById("uploadMsg");
const resetBtn = document.getElementById("resetBtn");
const formTitle = document.getElementById("formTitle");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productsList = document.getElementById("productsList");
const listMsg = document.getElementById("listMsg");

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================
function showMessage(element, message, type = "info") {
  element.textContent = message;
  element.className = `message ${type}`;
  element.classList.remove("hidden");
}

function hideMessage(element) {
  element.classList.add("hidden");
}

function getToken() {
  return localStorage.getItem("cattleya_admin_token");
}

function setToken(token) {
  localStorage.setItem("cattleya_admin_token", token);
}

function clearToken() {
  localStorage.removeItem("cattleya_admin_token");
}

function showLoginScreen() {
  loginScreen.classList.remove("hidden");
  adminScreen.classList.add("hidden");
}

function showAdminScreen() {
  loginScreen.classList.add("hidden");
  adminScreen.classList.remove("hidden");
}

// ============================================
// API CALLS
// ============================================
async function apiCall(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}`);
  }

  return data;
}

// ============================================
// LOGIN
// ============================================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessage(loginMsg);
  
  try {
    showMessage(loginMsg, "Ingresando...", "info");
    
    const data = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: loginEmail.value.trim(),
        password: loginPassword.value
      })
    });

    setToken(data.token);
    loginEmail.value = "";
    loginPassword.value = "";
    hideMessage(loginMsg);
    showAdminScreen();
    cargarProductos();
  } catch (e) {
    showMessage(loginMsg, e.message, "error");
  }
});

// ============================================
// LOGOUT
// ============================================
logoutBtn.addEventListener("click", () => {
  clearToken();
  resetForm();
  hideMessage(loginMsg);
  hideMessage(formMsg);
  showLoginScreen();
});

// ============================================
// CRUD DE PRODUCTOS
// ============================================
productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessage(formMsg);

  try {
    showMessage(formMsg, "Guardando...", "info");

    const isEditing = productId.value;
    const body = {
      name: productName.value.trim(),
      sku: productSku.value.trim(),
      priceCents: parseInt(productPrice.value) * 100,
      stock: parseInt(productStock.value) || 0,
      category: productCategory.value,
      subcategory: productSubcategory.value,
      description: productDescription.value.trim(),
      imageUrl: productImage.dataset.url || ""
    };

    if (!body.name || !body.sku || !body.priceCents) {
      throw new Error("Faltan datos requeridos (Nombre, SKU, Precio)");
    }

    let result;
    if (isEditing) {
      result = await apiCall(`/admin/products/${productId.value}`, {
        method: "PUT",
        body: JSON.stringify(body)
      });
    } else {
      result = await apiCall("/admin/products", {
        method: "POST",
        body: JSON.stringify(body)
      });
    }

    showMessage(formMsg, isEditing ? "Producto actualizado ✓" : "Producto creado ✓", "success");
    resetForm();
    cargarProductos();
  } catch (e) {
    showMessage(formMsg, e.message, "error");
  }
});

function resetForm() {
  productForm.reset();
  productId.value = "";
  formTitle.textContent = "Crear Producto";
  hideMessage(formMsg);
  hideMessage(uploadMsg);
  productImage.dataset.url = "";
}

resetBtn.addEventListener("click", resetForm);

// ============================================
// CARGAR PRODUCTOS
// ============================================
async function cargarProductos() {
  try {
    hideMessage(listMsg);
    productsList.innerHTML = "<p style='text-align:center; color:#999;'>Cargando...</p>";

    const search = searchInput.value.trim();
    const qs = new URLSearchParams({
      page: "1",
      pageSize: "100",
      ...(search ? { search } : {})
    });

    const data = await apiCall(`/admin/products?${qs.toString()}`);
    renderProductos(data.items || []);
    
    if (data.pagination) {
      showMessage(listMsg, `Total: ${data.pagination.total} producto(s)`, "info");
    }
  } catch (e) {
    productsList.innerHTML = `<p class='no-products'>Error: ${e.message}</p>`;
  }
}

function renderProductos(productos) {
  if (productos.length === 0) {
    productsList.innerHTML = "<p class='no-products'>No hay productos. Crea uno para empezar.</p>";
    return;
  }

  productsList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>SKU</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Categoría</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${productos.map(p => `
          <tr>
            <td>${p.name}</td>
            <td><small>${p.sku}</small></td>
            <td class="price">$${formatearPrecio(p.price_cents)}</td>
            <td>${p.stock}</td>
            <td><small>${p.category}</small></td>
            <td><span class="status ${p.status}">${p.status === "active" ? "Activo" : "Archivado"}</span></td>
            <td>
              <div class="actions">
                <button class="btn btn-secondary btn-small" onclick="editarProducto('${p.id}')">Editar</button>
                <button class="btn btn-danger btn-small" onclick="archivarProducto('${p.id}')">Archivar</button>
              </div>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function formatearPrecio(cents) {
  return Math.round(cents / 100).toLocaleString("es-AR");
}

async function editarProducto(id) {
  try {
    const data = await apiCall(`/admin/products/${id}`);
    
    productId.value = data.id;
    productName.value = data.name;
   productSku.value = data.sku;
    productPrice.value = Math.round(data.price_cents / 100);
    productStock.value = data.stock;
    productCategory.value = data.category || "";
    productSubcategory.value = data.subcategory || "";
    productDescription.value = data.description || "";
    
    if (data.image_url) {
      productImage.dataset.url = data.image_url;
    }
    
    formTitle.textContent = "Editar Producto";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (e) {
    showMessage(formMsg, `Error: ${e.message}`, "error");
  }
}

async function archivarProducto(id) {
  if (!confirm("¿Estás seguro de que querés archivar este producto?")) return;

  try {
    await apiCall(`/admin/products/${id}`, { method: "DELETE" });
    showMessage(listMsg, "Producto archivado ✓", "success");
    cargarProductos();
  } catch (e) {
    showMessage(listMsg, `Error: ${e.message}`, "error");
  }
}

// ============================================
// SUBIDA DE IMAGEN
// ============================================
productImage.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showMessage(uploadMsg, "La imagen es muy grande (máximo 5MB)", "error");
    productImage.value = "";
    return;
  }

  try {
    showMessage(uploadMsg, "Subiendo imagen...", "info");

    const formData = new FormData();
    formData.append("image", file);

    const token = getToken();
    const response = await fetch(`${API_URL}/admin/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Error subiendo imagen");

    productImage.dataset.url = data.url;
    showMessage(uploadMsg, "Imagen subida ✓", "success");
  } catch (e) {
    showMessage(uploadMsg, `Error: ${e.message}`, "error");
    productImage.value = "";
  }
}); 

// ============================================
// BÚSQUEDA
// ============================================
searchBtn.addEventListener("click", cargarProductos);
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") cargarProductos();
});

// ============================================
// INICIALIZACIÓN
// ============================================
function init() {
  const token = getToken();
  if (token) {
    showAdminScreen();
    cargarProductos();
  } else {
    showLoginScreen();
  }
}

init();
