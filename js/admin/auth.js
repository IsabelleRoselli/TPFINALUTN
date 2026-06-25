(() => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    const fd = new FormData(form);
    const payload = { email: fd.get("email"), password: fd.get("password") };

    try {
      const data = await window.apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      window.setToken(data.token);
      location.href = "/admin.html";
    } catch (err) {
      msg.textContent = err.message;
    }
  });
})();