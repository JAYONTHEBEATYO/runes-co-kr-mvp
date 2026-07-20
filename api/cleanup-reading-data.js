const crypto = require("node:crypto");
const { purgeExpiredData, retentionDays } = require("./reading-log-store");
const { isAuthorized } = require("./admin-session");

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const secret = String(process.env.CRON_SECRET || "").trim();
  const auth = String(req.headers.authorization || "");
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const cronAuthorized = Boolean(secret) && safeEqual(secret, bearer);
  if (!cronAuthorized && !isAuthorized(req)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  try {
    const result = await purgeExpiredData();
    res.statusCode = 200;
    res.end(JSON.stringify({ ...result, retentionDays: retentionDays() }));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Cleanup failed" }));
  }
};
