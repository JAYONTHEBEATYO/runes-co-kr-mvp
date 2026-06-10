module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const baseUrl = String(process.env.TAJUSSI_API_URL || "https://tajussi-api.startarot.co.kr").replace(/\/+$/, "");
  const configured = Boolean(String(process.env.TAJUSSI_API_KEY || "").trim());

  try {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    const health = await response.json().catch(() => null);
    res.statusCode = 200;
    res.end(JSON.stringify({
      configured,
      apiUrl: baseUrl,
      healthOk: response.ok,
      health
    }));
  } catch (error) {
    res.statusCode = 200;
    res.end(JSON.stringify({
      configured,
      apiUrl: baseUrl,
      healthOk: false,
      error: String(error.message || error).slice(0, 300)
    }));
  }
};
