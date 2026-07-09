const { listReadingLogs } = require("./reading-log-store");
const { isAuthorized } = require("./admin-session");

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  if (!isAuthorized(req)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  try {
    const url = new URL(req.url, "https://runes.co.kr");
    const limit = Number(url.searchParams.get("limit") || 50);
    const cursor = url.searchParams.get("cursor") || undefined;
    const result = await listReadingLogs({ limit, cursor });
    res.statusCode = 200;
    res.end(JSON.stringify(result));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({
      error: "Reading log lookup failed",
      detail: String(error.message || error).slice(0, 500)
    }));
  }
};
