const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Falta JWT_SECRET en .env");
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

async function login(email, password) {
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return null;

  const ok = await user.comparePassword(String(password));
  if (!ok) return null;

  const token = signToken({ userId: user._id.toString(), role: user.role, email: user.email });
  return { token, user: { id: user._id.toString(), email: user.email, role: user.role } };
}

async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@admin.com").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD || "admin123").trim();
  console.log("ensureAdmin check:", {
  email,
  adminPasswordRaw: process.env.ADMIN_PASSWORD,
  passwordLen: password.length,
});

  const existing = await User.findOne({ email });
  if (existing) return;

  await User.create({ email, password, role: "admin" });
  console.log("Admin creado:", email);
}

module.exports = { login, ensureAdmin };