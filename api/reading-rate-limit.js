const crypto = require("node:crypto");
const { clientFingerprint } = require("./reading-log-store");

const RATE_LIMIT_PREFIX = "reading-rate-limits/";
const DEFAULT_DAILY_LIMIT = 8;
const memoryReservations = new Map();

function dailyLimit() {
  const configured = Number(process.env.RUNES_DAILY_READING_LIMIT);
  return Number.isFinite(configured)
    ? Math.min(Math.max(Math.floor(configured), 1), 50)
    : DEFAULT_DAILY_LIMIT;
}

function koreaDay(now = new Date()) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function secondsUntilKoreaMidnight(now = new Date()) {
  const koreaNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const next = Date.UTC(koreaNow.getUTCFullYear(), koreaNow.getUTCMonth(), koreaNow.getUTCDate() + 1) - 9 * 60 * 60 * 1000;
  return Math.max(Math.ceil((next - now.getTime()) / 1000), 1);
}

async function reserveReading(req) {
  const now = new Date();
  const limit = dailyLimit();
  const fingerprint = clientFingerprint(req) || "local";
  const day = koreaDay(now);
  const resetSeconds = secondsUntilKoreaMidnight(now);

  if (!String(process.env.BLOB_READ_WRITE_TOKEN || "").trim()) {
    return reserveInMemory({ day, fingerprint, limit, resetSeconds });
  }

  const { list, put } = await import("@vercel/blob");
  const prefix = `${RATE_LIMIT_PREFIX}${day}/${fingerprint}/`;
  const existing = await list({ prefix, limit });
  if (existing.blobs.length >= limit) {
    return { allowed: false, limit, remaining: 0, resetSeconds };
  }

  const id = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");
  await put(`${prefix}${now.toISOString().replace(/[:.]/g, "-")}-${id}.txt`, "reserved", {
    access: "private",
    contentType: "text/plain; charset=utf-8",
    allowOverwrite: false
  });

  return {
    allowed: true,
    limit,
    remaining: Math.max(limit - existing.blobs.length - 1, 0),
    resetSeconds
  };
}

function reserveInMemory({ day, fingerprint, limit, resetSeconds }) {
  const key = `${day}:${fingerprint}`;
  const used = memoryReservations.get(key) || 0;
  if (used >= limit) return { allowed: false, limit, remaining: 0, resetSeconds };
  memoryReservations.set(key, used + 1);
  if (memoryReservations.size > 5000) {
    for (const storedKey of memoryReservations.keys()) {
      if (!storedKey.startsWith(`${day}:`)) memoryReservations.delete(storedKey);
    }
  }
  return { allowed: true, limit, remaining: limit - used - 1, resetSeconds };
}

function applyRateLimitHeaders(res, result) {
  res.setHeader("X-RateLimit-Limit", String(result.limit));
  res.setHeader("X-RateLimit-Remaining", String(result.remaining));
  res.setHeader("X-RateLimit-Reset", String(result.resetSeconds));
  if (!result.allowed) res.setHeader("Retry-After", String(result.resetSeconds));
}

module.exports = {
  applyRateLimitHeaders,
  dailyLimit,
  koreaDay,
  reserveReading,
  secondsUntilKoreaMidnight
};
