require("dotenv").config();
const bcryptjs = require("bcryptjs");
const connectDb = require("../config/db");
const db = require("../models");
const { loadAppSettings } = require("../config/appSettings");

async function main() {
  await connectDb();

  const settings = loadAppSettings();
  const adminCfg = settings?.DefaultAdmin;
  if (!adminCfg?.email || !adminCfg?.password) {
    console.error("Missing DefaultAdmin config in appsettings.json");
    process.exit(1);
  }

  const existing = await db.User.findOne({ email: adminCfg.email });
  if (existing) {
    console.log("Admin already exists:", existing.email);
    process.exit(0);
  }

  const hashedPassword = await bcryptjs.hash(adminCfg.password, 10);
  const admin = new db.User({
    email: adminCfg.email,
    password: hashedPassword,
    name: adminCfg.name || "Admin",
    role: "admin",
    isVerified: true
  });

  await admin.save();
  console.log("Created admin:", admin.email);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

