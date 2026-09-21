const { sign, json } = require("./_auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { ok:false, message:"Method not allowed" });

  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USERNAME || "";
  const adminPass = process.env.ADMIN_PASSWORD || "";

  if (!adminUser || !adminPass) {
    return json(res, 500, { ok:false, message:"Admin credentials are not configured" });
  }

  if (username !== adminUser || password !== adminPass) {
    return json(res, 401, { ok:false, message:"Invalid credentials" });
  }

  const token = sign({
    role: "admin",
    iat: Date.now(),
    exp: Date.now() + 8 * 60 * 60 * 1000
  });

  return json(res, 200, { ok:true }, {
    "Set-Cookie": `snx_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`,
    "Cache-Control": "no-store"
  });
};
