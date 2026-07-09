const { clearSessionCookie } = require("./admin-session");

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  res.setHeader("Set-Cookie", clearSessionCookie());
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
};
