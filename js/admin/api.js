window.API_BASE = "http://localhost:3001";

window.getToken = () => localStorage.getItem("admin_token");
window.setToken = (t) => localStorage.setItem("admin_token", t);
window.clearToken = () => localStorage.removeItem("admin_token");

window.apiFetch = async (path, options = {}) => {
  const token = window.getToken();
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  // set content-type si mandamos body JSON
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${window.API_BASE}${path}`, { ...options, headers });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (res.status === 401) {
    window.clearToken();
    throw new Error("Sesión expirada. Volvé a iniciar sesión.");
  }

  if (!res.ok) {
    throw new Error((data && data.error) ? data.error : `Error HTTP ${res.status}`);
  }

  return data;
};