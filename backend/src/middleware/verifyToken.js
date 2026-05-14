const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return res.status(401).json({ error: "Falta Bearer token" });

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o vencido" });
  }
}

function requireAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Solo admin" });
    next();
  });
}

module.exports = { verifyToken, requireAdmin };