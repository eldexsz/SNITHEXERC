const { json } = require("./_auth");

module.exports = async (req, res) => {
  return json(res, 200, { ok:true }, {
    "Set-Cookie": "snx_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
    "Cache-Control": "no-store"
  });
};
