const userService = require("../services/userService");

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Faltan datos" });

  const result = await userService.login(email, password);
  if (!result) return res.status(401).json({ error: "Credenciales inválidas" });

  res.json(result);
}

module.exports = { login };