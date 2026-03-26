function generateCustomerCode() {
  // Short human-readable code
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  return `CUST-${ts}-${rand}`;
}

module.exports = { generateCustomerCode };

