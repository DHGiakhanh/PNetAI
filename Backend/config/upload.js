const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeBase = path.basename(file.originalname).replace(/[^\w.\-]+/g, "_");
    cb(null, `${Date.now()}_${safeBase}`);
  }
});

const upload = multer({ storage });

module.exports = { upload };

