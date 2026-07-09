const { createSessionCookie, verifyAdminToken } = require("./admin-session");

function getBody(req) {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return req.body || {};
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const body = getBody(req);
    if (!verifyAdminToken(String(body.token || ""))) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    res.setHeader("Set-Cookie", createSessionCookie());
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Invalid request" }));
  }
};
