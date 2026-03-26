const bcryptjs = require("bcryptjs");
const db = require("../models");
const { loadAppSettings } = require("./appSettings");

async function ensureDefaultAdmin() {
  const settings = loadAppSettings();
  const adminCfg = settings?.DefaultAdmin;
  if (!adminCfg?.email || !adminCfg?.password) return;

  const existing = await db.User.findOne({ email: adminCfg.email });
  if (existing) return;

  const hashedPassword = await bcryptjs.hash(adminCfg.password, 10);

  const admin = new db.User({
    email: adminCfg.email,
    password: hashedPassword,
    name: adminCfg.name || "Admin",
    role: "admin",
    isVerified: true
  });

  await admin.save();
}

module.exports = { ensureDefaultAdmin };

