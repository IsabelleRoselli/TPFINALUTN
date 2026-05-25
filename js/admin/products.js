(() => {
  const table = document.getElementById("table");
  const msg = document.getElementById("msg");
  const q = document.getElementById("q");
  const btnLogout = document.getElementById("btnLogout");
  const btnGoCatalogo = document.getElementById("btnGoCatalogo");

  const createForm = document.getElementById("createForm");
  const createMsg = document.getElementById("createMsg");

  // Form fields
  const productIdInput = document.getElementById("productId"); // hidden
  const btnCancelEdit = document.getElementById("btnCancelEdit");
  const btnSubmit = document.getElementById("btnSubmit");

  const nameInput = createForm.querySelector('input[name="name"]');
  const descriptionInput = createForm.querySelector('input[name="description"]');
  const skuInput = createForm.querySelector('input[name="sku"]');
  const priceARSInput = createForm.querySelector('input[name="priceARS"]');
  const stockInput = createForm.querySelector('input[name="stock"]');
  const categorySelect = createForm.querySelector('select[name="category"]');
  const statusSelect = createForm.querySelector('select[name="status"]');
  const imageUrlInput = createForm.querySelector('input[name="imageUrl"]');

  // Upload widgets
  const imageFile = document.getElementById("imageFile");
  const btnUpload = document.getElementById("btnUpload");
  const uploadMsg = document.getElementById("uploadMsg");

  function requireToken() {
    if (!window.getToken()) location.href = "/admin/login";
  }

  function formatARSFromCents(cents) {
    const n = Number(cents);
    if (!Number.isFinite(n)) return "";
    const ars = n / 100;
    return `AR$ ${ars.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function centsFromARSInput(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100);
  }

  function setModeCreate() {
    productIdInput.value = "";
    btnSubmit.innerHTML = `<i class="fas fa-plus"></i> Crear`;
    btnCancelEdit.style.display = "none";
    createMsg.textContent = "";
    if (uploadMsg) uploadMsg.textContent = "";
    createForm.reset();

    // defaults
    if (stockInput) stockInput.value = "0";
    if (statusSelect) statusSelect.value = "active";
    if (categorySelect) categorySelect.value = "";
  }

  function setModeEdit(product) {
    productIdInput.value = product.id || product._id || "";
    btnSubmit.innerHTML = `<i class="fas fa-floppy-disk"></i> Guardar cambios`;
    btnCancelEdit.style.display = "inline-flex";
    createMsg.textContent = "";

    nameInput.value = product.name ?? "";
    descriptionInput.value = product.description ?? "";
    skuInput.value = product.sku ?? "";

    const cents = product.price_cents ?? product.priceCents ?? 0;
    priceARSInput.value = (Number(cents) / 100).toFixed(2);

    stockInput.value = String(product.stock ?? 0);

    // El category ahora será string igual al value del select
    if (categorySelect) categorySelect.value = product.category ?? "";

    if (statusSelect) statusSelect.value = product.status ?? "active";

    imageUrlInput.value = product.image_url ?? product.imageUrl ?? "";

    createForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (btnGoCatalogo) {
    btnGoCatalogo.addEventListener("click", () => {
      location.href = "./pages/catalogo.html";
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      window.clearToken();
      location.href = "/admin/login";
    });
  }

  if (btnCancelEdit) {
    btnCancelEdit.addEventListener("click", () => {
      setModeCreate();
    });
  }

  if (btnUpload) {
    btnUpload.addEventListener("click", async () => {
      if (uploadMsg) uploadMsg.textContent = "";

      const file = imageFile?.files?.[0];
      if (!file) {
        if (uploadMsg) uploadMsg.textContent = "Elegí una imagen primero.";
        return;
      }

      try {
        const fd = new FormData();
        fd.append("image", file);

        const data = await window.apiFetch("/admin/upload", {
          method: "POST",
          body: fd,
        });

        imageUrlInput.value = data.url;
        if (uploadMsg) uploadMsg.textContent = "Imagen subida OK.";
      } catch (err) {
        if (uploadMsg) uploadMsg.textContent = err.message || "Error subiendo imagen.";
      }
    });
  }

  let items = [];

  function render(list) {
    if (!list.length) {
      table.innerHTML = "<p>No hay productos.</p>";
      return;
    }

    const rows = list
      .map((p) => {
        const id = p.id || p._id;
        const priceCents = p.price_cents ?? p.priceCents;
        const isArchived = (p.status || "") === "archived";

        return `
          <tr>
            <td style="padding:8px;">${p.name ?? ""}</td>
            <td style="padding:8px;">${p.sku ?? ""}</td>
            <td style="padding:8px;">${formatARSFromCents(priceCents)}</td>
            <td style="padding:8px;">${p.stock ?? ""}</td>
            <td style="padding:8px;">${p.status ?? ""}</td>
            <td style="padding:8px;">${p.category ?? ""}</td>
            <td style="padding:8px; white-space:nowrap; display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn btn-menu" data-action="edit" data-id="${id}">Editar</button>
              ${
                isArchived
                  ? `<button class="btn btn-menu" data-action="activate" data-id="${id}">Activar</button>`
                  : `<button class="btn btn-volver" data-action="archive" data-id="${id}">Archivar</button>`
              }
            </td>
          </tr>
        `;
      })
      .join("");

    table.innerHTML = `
      <div style="overflow:auto;">
        <table border="1" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="padding:8px;">Nombre</th>
              <th style="padding:8px;">SKU</th>
              <th style="padding:8px;">Precio</th>
              <th style="padding:8px;">Stock</th>
              <th style="padding:8px;">Estado</th>
              <th style="padding:8px;">Categoría</th>
              <th style="padding:8px;">Acciones</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  async function load() {
    msg.textContent = "";
    table.innerHTML = "<p>Cargando...</p>";
    try {
      const data = await window.apiFetch("/admin/products?page=1&pageSize=50");
      items = data.items || [];
      render(items);
    } catch (err) {
      msg.textContent = err.message || "Error cargando productos.";
      table.innerHTML = "";
      if ((err.message || "").includes("Sesión expirada")) location.href = "/admin/login";
    }
  }

  q.addEventListener("input", () => {
    const term = (q.value || "").toLowerCase().trim();
    if (!term) return render(items);

    render(
      items.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(term) ||
          (p.sku || "").toLowerCase().includes(term)
      )
    );
  });

  table.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!id) return;

    try {
      if (action === "edit") {
        const product = items.find((x) => (x.id || x._id) === id);
        if (!product) return alert("No se encontró el producto en la lista.");
        setModeEdit(product);
        return;
      }

      if (action === "archive") {
        const ok = confirm("¿Archivar este producto? (dejará de mostrarse en el catálogo)");
        if (!ok) return;

        await window.apiFetch(`/admin/products/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });

        if (productIdInput.value === id) setModeCreate();

        await load();
        return;
      }

      if (action === "activate") {
        await window.apiFetch(`/admin/products/${encodeURIComponent(id)}`, {
          method: "PUT",
          body: JSON.stringify({ status: "active" }),
        });
        await load();
        return;
      }
    } catch (err) {
      alert(err.message || "Acción fallida.");
    }
  });

  createForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    createMsg.textContent = "";

    const fd = new FormData(createForm);
    const raw = Object.fromEntries(fd.entries());

    const id = (raw.id || "").toString().trim();
    const priceCents = centsFromARSInput(raw.priceARS);
    if (priceCents == null) {
      createMsg.textContent = "El precio debe ser un número válido (AR$).";
      return;
    }

    const stock = raw.stock === "" || raw.stock == null ? 0 : Number(raw.stock);
    if (!Number.isFinite(stock) || stock < 0) {
      createMsg.textContent = "El stock debe ser un número válido.";
      return;
    }

    const payload = {
      name: String(raw.name || "").trim(),
      description: String(raw.description || "").trim(),
      sku: String(raw.sku || "").trim(),
      priceCents,
      stock,
      category: String(raw.category || "").trim(),
      status: String(raw.status || "active").trim(),
      imageUrl: String(raw.imageUrl || "").trim(),
    };

    if (!payload.name) return (createMsg.textContent = "El nombre es obligatorio.");
    if (!payload.sku) return (createMsg.textContent = "El SKU es obligatorio.");
    if (!payload.category) return (createMsg.textContent = "Elegí una categoría.");

    try {
      if (id) {
        await window.apiFetch(`/admin/products/${encodeURIComponent(id)}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        createMsg.textContent = "Producto actualizado.";
      } else {
        await window.apiFetch("/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        createMsg.textContent = "Producto creado.";
      }

      await load();
      setModeCreate();
    } catch (err) {
      createMsg.textContent = err.message || "No se pudo guardar el producto.";
    }
  });

  requireToken();
  setModeCreate();
  load();
})();