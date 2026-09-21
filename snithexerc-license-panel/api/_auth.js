const crypto = require("crypto");

function secret() {
  return process.env.SESSION_SECRET || "CHANGE_THIS_SESSION_SECRET";
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!data.exp || Date.now() > data.exp) return null;
    return data;
  } catch { return null; }
}

function requireAdmin(req, res) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)snx_session=([^;]+)/);
  const session = verify(match ? decodeURIComponent(match[1]) : "");
  if (!session || session.role !== "admin") {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, message: "Unauthorized" }));
    return null;
  }
  return session;
}

function json(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  Object.entries(extraHeaders).forEach(([k,v]) => res.setHeader(k, v));
  res.end(JSON.stringify(body));
}

module.exports = { sign, verify, requireAdmin, json };
