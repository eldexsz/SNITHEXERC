const { requireAdmin, json } = require("./_auth");

module.exports = async (req, res) => {
  const session = requireAdmin(req, res);
  if (!session) return;

  if (req.method !== "POST") return json(res, 405, { ok:false, message:"Method not allowed" });

  const { id } = req.body || {};
  const store = globalThis.__SNX_LICENSE_STORE || [];

  const item = store.find(x => x.id === id);
  if (!item) return json(res, 404, { ok:false, message:"Key not found" });

  item.status = "revoked";
  return json(res, 200, { ok:true, key:item });
};
