const crypto = require("node:crypto");

const COOKIE_NAME = "runes_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 2;

function getAdminToken() {
  return String(process.env.RUNES_ADMIN_TOKEN || "").trim();
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyAdminToken(value) {
  const token = getAdminToken();
  if (!token || !value) return false;
  return safeEqual(value, token);
}

function sign(payload) {
  const secret = getAdminToken();
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSessionCookie() {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iat: issuedAt }), "utf8").toString("base64url");
  const value = `${payload}.${sign(payload)}`;
  return serializeCookie(COOKIE_NAME, value, SESSION_TTL_SECONDS);
}

function clearSessionCookie() {
  return serializeCookie(COOKIE_NAME, "", 0);
}

function isAuthorized(req) {
  const token = getAdminToken();
  if (!token) return false;

  const headerToken = String(req.headers["x-admin-token"] || "").trim();
  const auth = String(req.headers.authorization || "");
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if ((headerToken && safeEqual(headerToken, token)) || (bearer && safeEqual(bearer, token))) {
    return true;
  }

  const cookieValue = parseCookies(req.headers.cookie || "")[COOKIE_NAME];
  return verifySessionCookie(cookieValue);
}

function verifySessionCookie(value) {
  if (!value || !value.includes(".")) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const issuedAt = Number(parsed.iat || 0);
    const age = Math.floor(Date.now() / 1000) - issuedAt;
    return issuedAt > 0 && age >= 0 && age <= SESSION_TTL_SECONDS;
  } catch {
    return false;
  }
}

function parseCookies(header) {
  return String(header || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const index = part.indexOf("=");
      if (index === -1) return cookies;
      cookies[decodeURIComponent(part.slice(0, index))] = decodeURIComponent(part.slice(index + 1));
      return cookies;
    }, {});
}

function serializeCookie(name, value, maxAge) {
  return [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${maxAge}`
  ].join("; ");
}

module.exports = {
  clearSessionCookie,
  createSessionCookie,
  isAuthorized,
  verifyAdminToken
};
