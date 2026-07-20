const { deleteReadingByOwner } = require("./reading-log-store");

function getBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return {};
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
    const result = await deleteReadingByOwner({
      id: body.id,
      createdAt: body.createdAt,
      token: body.token
    });
    if (!result.deleted) {
      res.statusCode = ["unauthorized", "not-found"].includes(result.reason) ? 404 : 400;
      res.end(JSON.stringify({ error: "Reading could not be deleted", reason: result.reason }));
      return;
    }
    res.statusCode = 200;
    res.end(JSON.stringify({ deleted: true }));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Reading deletion failed" }));
  }
};
