const fs = require("fs");
const path = require("path");

function loadAppSettings() {
  const filePath = path.join(__dirname, "..", "appsettings.json");
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

module.exports = { loadAppSettings };

