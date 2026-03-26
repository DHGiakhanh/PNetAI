const verifyToken = require("./verifyToken");

function requireAuth(req, res, next) {
  return verifyToken(req, res, next);
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.role) return res.status(401).json({ message: "Unauthorized" });
    if (req.role !== role) return res.status(403).json({ message: "Access denied" });
    return next();
  };
}

function requireAnyRole(roles = []) {
  const allowed = new Set(roles);
  return (req, res, next) => {
    if (!req.role) return res.status(401).json({ message: "Unauthorized" });
    if (!allowed.has(req.role)) return res.status(403).json({ message: "Access denied" });
    return next();
  };
}

module.exports = { requireAuth, requireRole, requireAnyRole };

