const { requireAdmin, json } = require("./_auth");

module.exports = async (req, res) => {
  const session = requireAdmin(req, res);
  if (!session) return;
  return json(res, 200, { ok:true, role:"admin", expiresAt:session.exp });
};
