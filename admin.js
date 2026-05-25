// ============================================
// CONFIGURACIÓN DE API
// ============================================
const getApiUrl = () => {
  // Si estás en localhost, usa localhost:3001
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  // En producción, usa la URL del backend deployado
  // Reemplaza con tu URL real de producción
  return 'https://tu-backend-produccion.com'; // ← REEMPLAZA ESTO
};

const API_URL = getApiUrl();

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginMsg = document.getElementById("loginError"); // Nota: loginError, no loginMsg

const productForm = document.getElementById("productForm");
const productId = document.getElementById("productId");
const productName = document.getElementById("productName");
const productSku = document.getElementById("productSku"); // ✓ Correcto
const productPrice = document.getElementById("productPrice");
const productStock = document.getElementById("productStock");
const productCategory = document.getElementById("productCategory");
const productSubcategory = document.getElementById("productSubcategory");
const productImage = document.getElementById("productImage");
const productDescription = document.getElementById("productDescription");

const formMsg = document.getElementById("formMessage");
const uploadMsg = document.getElementById("uploadMessage");
const resetBtn = document.getElementById("resetBtn");
const formTitle = document.getElementById("formTitle");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productsBody = document.getElementById("productsBody");
const noProducts = document.getElementById("noProducts");

const imagePreview = document.getElementById("imagePreview");
const uploadBtn = document.getElementById("uploadBtn");

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================
function showMessage(element, message, type = "success") {
  if (!element) return;
  element.textContent = message;
  element.classList.remove("hidden");
  element.classList.add("show");
  element.className = `message show ${type}`;
}

function hideMessage(element) {
  if (!element) return;
  element.classList.add("hidden");
  element.classList.remove("show");
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

function showLoginScreen() {
  loginSection.classList.remove("hidden");
  adminSection.classList.add("hidden");
}

function showAdminScreen() {
  loginSection.classList.add("hidden");
  adminSection.classList.remove("hidden");
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

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Error ${response.status}`);
    }

    return data;
  } catch (e) {
    console.error("API Error:", e.message);
    throw e;
  }
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

    if (!data.token) {
      throw new Error("No se recibió token");
    }

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
  productForm.reset();
  loginForm.reset();
  hideMessage(loginMsg);
  hideMessage(formMsg);
  imageUrl = "";
  imagePreview.src = "";
  imagePreview.classList.remove("show");
  showLoginScreen();
});

// ============================================
// VARIABLES GLOBALES
// ============================================
let imageUrl = "";

// ============================================
// SUBIDA DE IMAGEN
// ============================================
uploadBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  
  const file = productImage.files[0];
  if (!file) {
    showMessage(uploadMsg, "Selecciona una imagen primero", "error");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showMessage(uploadMsg, "La imagen es muy grande (máximo 5MB)", "error");
    productImage.value = "";
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
    showMessage(uploadMsg, "Subiendo imagen...", "info");

    const token = getToken();
    const response = await fetch(`${API_URL}/admin/upload`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Error subiendo imagen");

    imageUrl = data.url; // ✓ GUARDA EN VARIABLE GLOBAL
    imagePreview.src = imageUrl;
    imagePreview.classList.add("show");
    showMessage(uploadMsg, "Imagen subida ✓", "success");
  } catch (e) {
    showMessage(uploadMsg, `Error: ${e.message}`, "error");
    imageUrl = "";
  }
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
      imageUrl: imageUrl || ""
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
    
    // Limpiar después de guardar
    setTimeout(() => {
      productForm.reset();
      productId.value = "";
      imageUrl = "";
      imagePreview.src = "";
      imagePreview.classList.remove("show");
      formTitle.textContent = "Crear Producto";
      cargarProductos();
    }, 800);
  } catch (e) {
    showMessage(formMsg, e.message, "error");
  }
});

// ============================================
// CARGAR PRODUCTOS
// ============================================
async function cargarProductos() {
  try {
    hideMessage(loginMsg);
    productsBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Cargando...</td></tr>";

    const search = searchInput.value.trim();
    const qs = new URLSearchParams({
      page: "1",
      pageSize: "100",
      ...(search ? { search } : {})
    });

    const data = await apiCall(`/admin/products?${qs.toString()}`);
    renderProductos(data.items || []);
  } catch (e) {
    productsBody.innerHTML = `<tr><td colspan='7' style='color:red;'>Error: ${e.message}</td></tr>`;
  }
}

function renderProductos(productos) {
  if (productos.length === 0) {
    noProducts.style.display = "block";
    productsBody.innerHTML = "";
    return;
  }

  noProducts.style.display = "none";
  productsBody.innerHTML = productos.map(p => `
    <tr>
      <td>${p.name}</td>
      <td><small>${p.sku}</small></td>
      <td class="price-cell">$${Math.round(p.price_cents / 100).toLocaleString("es-AR")}</td>
      <td>${p.stock}</td>
      <td><small>${p.category || "-"}</small></td>
      <td><span class="status-${p.status}">${p.status === "active" ? "✓ Activo" : "Archivado"}</span></td>
      <td>
        <button class="btn btn-secondary btn-small" onclick="editarProducto('${p.id}')">Editar</button>
        <button class="btn btn-danger btn-small" onclick="archivarProducto('${p.id}')">Archivar</button>
      </td>
    </tr>
  `).join("");
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
    
    imageUrl = data.image_url || "";
    if (imageUrl) {
      imagePreview.src = imageUrl;
      imagePreview.classList.add("show");
    } else {
      imagePreview.classList.remove("show");
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
    showMessage(formMsg, "Producto archivado ✓", "success");
    cargarProductos();
  } catch (e) {
    showMessage(formMsg, `Error: ${e.message}`, "error");
  }
}

// ============================================
// BÚSQUEDA
// ============================================
if (searchBtn) {
  searchBtn.addEventListener("click", cargarProductos);
}
if (searchInput) {
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") cargarProductos();
  });
}

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
