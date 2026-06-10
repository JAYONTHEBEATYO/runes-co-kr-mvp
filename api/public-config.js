module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");

  res.statusCode = 200;
  res.end(JSON.stringify({
    googleMapsApiKey: String(process.env.GOOGLE_MAPS_BROWSER_KEY || "").trim()
  }));
};
