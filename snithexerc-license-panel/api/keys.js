const { requireAdmin, json } = require("./_auth");
const crypto = require("crypto");

// Demo storage intentionally kept in memory.
// For production, replace this with Vercel KV/Postgres/another persistent database.
const store = globalThis.__SNX_LICENSE_STORE || (globalThis.__SNX_LICENSE_STORE = []);

function makeKey() {
  const raw = crypto.randomBytes(12).toString("hex").toUpperCase();
  return `SNX-${raw.slice(0,4)}-${raw.slice(4,8)}-${raw.slice(8,12)}-${raw.slice(12,16)}-${raw.slice(16,24)}`;
}

module.exports = async (req, res) => {
  const session = requireAdmin(req, res);
  if (!session) return;

  if (req.method === "GET") {
    return json(res, 200, { ok:true, keys:store });
  }

  if (req.method !== "POST") return json(res, 405, { ok:false, message:"Method not allowed" });

  const body = req.body || {};
  const days = Math.max(1, Math.min(3650, Number(body.days || 30)));

  const item = {
    id: crypto.randomUUID(),
    key: makeKey(),
    status: "active",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + days * 86400000).toISOString()
  };

  store.unshift(item);
  return json(res, 201, { ok:true, key:item });
};
