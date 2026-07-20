const crypto = require("node:crypto");

const LOG_PREFIX = "reading-logs/";
const RATE_LIMIT_PREFIX = "reading-rate-limits/";
const MAX_LIST_LIMIT = 100;
const DEFAULT_RETENTION_DAYS = 90;
const DEFAULT_RATE_LIMIT_RETENTION_DAYS = 3;

function hasBlobStorage() {
  return Boolean(String(process.env.BLOB_READ_WRITE_TOKEN || "").trim());
}

function createReadingId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return crypto.randomBytes(16).toString("hex");
}

function hashValue(value) {
  const secret = String(process.env.RUNES_ADMIN_TOKEN || process.env.GEMINI_API_KEY || "").trim();
  if (!secret || !value) return null;
  return crypto.createHmac("sha256", secret).update(String(value)).digest("hex").slice(0, 24);
}

function clientFingerprint(req) {
  return hashValue(forwardedIp(req));
}

function hashDeletionToken(value) {
  return hashValue(`reading-delete:${value}`);
}

function pathnameFor(date, id) {
  const iso = date.toISOString();
  const day = iso.slice(0, 10).replace(/-/g, "/");
  return `${LOG_PREFIX}${day}/${iso.replace(/[:.]/g, "-")}-${id}.json`;
}

function redactAstrology(astrology) {
  if (!astrology || typeof astrology !== "object") return null;
  return {
    calendar: astrology.calendar || null,
    birthDate: astrology.birthDate || null,
    birthTime: astrology.birthTime || null,
    gender: astrology.gender || null,
    genderKo: astrology.genderKo || null,
    birthPlace: astrology.birthPlace || null,
    currentPlace: astrology.currentPlace || null,
    birthGeo: astrology.birthGeo ? {
      formattedAddress: astrology.birthGeo.formattedAddress || null,
      lat: astrology.birthGeo.lat || null,
      lng: astrology.birthGeo.lng || null,
      provider: astrology.birthGeo.provider || null
    } : null,
    currentGeo: astrology.currentGeo ? {
      formattedAddress: astrology.currentGeo.formattedAddress || null,
      lat: astrology.currentGeo.lat || null,
      lng: astrology.currentGeo.lng || null,
      provider: astrology.currentGeo.provider || null
    } : null,
    sun: astrology.sun || null,
    precision: astrology.precision || null
  };
}

function summarizeRune(rune, index, positions) {
  return {
    position: positions[index] || null,
    id: rune.id,
    order: rune.order,
    symbol: rune.symbol,
    name: rune.name,
    ko: rune.ko,
    keywords: rune.keywords || []
  };
}

function buildReadingLog({
  req,
  question,
  topic,
  topicLabel,
  spread,
  spreadKey,
  spreadTitle,
  positions,
  runes,
  astrology,
  tajussi,
  reading,
  model,
  deletionTokenHash
}) {
  const createdAt = new Date();
  const id = createReadingId();
  return {
    id,
    createdAt: createdAt.toISOString(),
    request: {
      clientHash: clientFingerprint(req)
    },
    privacy: {
      deletionTokenHash: deletionTokenHash || null,
      retentionDays: retentionDays()
    },
    input: {
      question,
      topic,
      topicLabel,
      spread,
      spreadKey,
      spreadTitle,
      positions,
      runes: runes.map((rune, index) => summarizeRune(rune, index, positions)),
      astrology: redactAstrology(astrology)
    },
    output: {
      reading,
      model,
      provider: "gemini",
      source: "runes-reading-agent-ko",
      tajussi: tajussi ? { enabled: true, source: tajussi.source || null } : { enabled: false }
    }
  };
}

async function saveReadingLog(record) {
  if (!hasBlobStorage()) return { saved: false, reason: "blob-token-missing" };
  const { put } = await import("@vercel/blob");
  const createdAt = new Date(record.createdAt);
  const pathname = pathnameFor(createdAt, record.id);
  const blob = await put(pathname, JSON.stringify(record, null, 2), {
    access: "private",
    contentType: "application/json; charset=utf-8",
    allowOverwrite: false
  });
  return { saved: true, pathname: blob.pathname, url: blob.url };
}

async function listReadingLogs({ limit = 50, cursor } = {}) {
  if (!hasBlobStorage()) return { configured: false, logs: [], hasMore: false };
  const { get, list } = await import("@vercel/blob");
  const requestedLimit = Math.min(Math.max(Number(limit) || 50, 1), MAX_LIST_LIMIT);
  const allBlobs = [];
  let nextCursor = cursor;
  for (let page = 0; page < 10; page += 1) {
    const result = await list({ prefix: LOG_PREFIX, limit: 1000, cursor: nextCursor });
    allBlobs.push(...result.blobs);
    if (!result.hasMore || !result.cursor) break;
    nextCursor = result.cursor;
  }
  const blobs = allBlobs
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, requestedLimit);
  const logs = [];
  for (const blob of blobs) {
    const item = await get(blob.pathname, { access: "private", useCache: false });
    if (!item?.stream) continue;
    const text = await streamToText(item.stream);
    try {
      const parsed = JSON.parse(text);
      logs.push({
        id: parsed.id,
        createdAt: parsed.createdAt,
        pathname: blob.pathname,
        question: parsed.input?.question || "",
        topic: parsed.input?.topic || "",
        topicLabel: parsed.input?.topicLabel || "",
        spreadTitle: parsed.input?.spreadTitle || "",
        runes: parsed.input?.runes || [],
        astrology: parsed.input?.astrology || null,
        tajussi: parsed.output?.tajussi || { enabled: false },
        model: parsed.output?.model || "",
        reading: parsed.output?.reading || "",
        request: parsed.request || {}
      });
    } catch {
      logs.push({ pathname: blob.pathname, createdAt: blob.uploadedAt, parseError: true });
    }
  }
  return { configured: true, logs, cursor: null, hasMore: allBlobs.length > requestedLimit };
}

async function deleteReadingLog(pathname) {
  if (!hasBlobStorage()) return { deleted: false, reason: "blob-token-missing" };
  const safePath = String(pathname || "");
  if (!safePath.startsWith(LOG_PREFIX) || !safePath.endsWith(".json")) {
    return { deleted: false, reason: "invalid-path" };
  }
  const { del } = await import("@vercel/blob");
  await del(safePath);
  return { deleted: true, pathname: safePath };
}

async function deleteReadingByOwner({ id, createdAt, token }) {
  if (!hasBlobStorage()) return { deleted: false, reason: "blob-token-missing" };
  const safeId = String(id || "").trim();
  const date = new Date(createdAt);
  if (!/^[a-f0-9-]{32,40}$/i.test(safeId) || Number.isNaN(date.getTime()) || !token) {
    return { deleted: false, reason: "invalid-request" };
  }

  const dayPrefix = `${LOG_PREFIX}${date.toISOString().slice(0, 10).replace(/-/g, "/")}/`;
  const { get, list } = await import("@vercel/blob");
  let cursor;
  for (let page = 0; page < 10; page += 1) {
    const result = await list({ prefix: dayPrefix, limit: 100, cursor });
    const blob = result.blobs.find((item) => item.pathname.endsWith(`-${safeId}.json`));
    if (blob) {
      const item = await get(blob.pathname, { access: "private", useCache: false });
      if (!item?.stream) return { deleted: false, reason: "not-found" };
      const record = JSON.parse(await streamToText(item.stream));
      const expected = String(record.privacy?.deletionTokenHash || "");
      const actual = String(hashDeletionToken(token) || "");
      if (!safeEqual(expected, actual)) return { deleted: false, reason: "unauthorized" };
      return deleteReadingLog(blob.pathname);
    }
    if (!result.hasMore || !result.cursor) break;
    cursor = result.cursor;
  }
  return { deleted: false, reason: "not-found" };
}

async function purgeExpiredData() {
  if (!hasBlobStorage()) return { configured: false, deleted: 0 };
  const readingCutoff = Date.now() - retentionDays() * 86400000;
  const rateCutoff = Date.now() - rateLimitRetentionDays() * 86400000;
  const deleted = [];
  await collectExpired(LOG_PREFIX, readingCutoff, deleted);
  await collectExpired(RATE_LIMIT_PREFIX, rateCutoff, deleted);
  if (deleted.length) {
    const { del } = await import("@vercel/blob");
    for (let index = 0; index < deleted.length; index += 100) {
      await del(deleted.slice(index, index + 100));
    }
  }
  const scrubbed = await scrubLegacyReadingLogs();
  return { configured: true, deleted: deleted.length, scrubbed };
}

async function scrubLegacyReadingLogs() {
  const { get, list, put } = await import("@vercel/blob");
  let cursor;
  let scrubbed = 0;
  for (let page = 0; page < 10; page += 1) {
    const result = await list({ prefix: LOG_PREFIX, limit: 1000, cursor });
    for (const blob of result.blobs) {
      const item = await get(blob.pathname, { access: "private", useCache: false });
      if (!item?.stream) continue;
      const record = JSON.parse(await streamToText(item.stream));
      const legacyIp = record.request?.ip || null;
      const hasLegacyFields = Boolean(legacyIp || record.request?.userAgent || record.request?.referer);
      if (!hasLegacyFields) continue;
      record.request = { clientHash: legacyIp ? hashValue(legacyIp) : null };
      record.privacy = {
        ...(record.privacy || {}),
        retentionDays: retentionDays()
      };
      await put(blob.pathname, JSON.stringify(record, null, 2), {
        access: "private",
        contentType: "application/json; charset=utf-8",
        allowOverwrite: true
      });
      scrubbed += 1;
    }
    if (!result.hasMore || !result.cursor) break;
    cursor = result.cursor;
  }
  return scrubbed;
}

async function collectExpired(prefix, cutoff, target) {
  const { list } = await import("@vercel/blob");
  let cursor;
  for (let page = 0; page < 20; page += 1) {
    const result = await list({ prefix, limit: 1000, cursor });
    for (const blob of result.blobs) {
      if (new Date(blob.uploadedAt).getTime() < cutoff) target.push(blob.pathname);
    }
    if (!result.hasMore || !result.cursor) break;
    cursor = result.cursor;
  }
}

function retentionDays() {
  return boundedDays(process.env.RUNES_LOG_RETENTION_DAYS, DEFAULT_RETENTION_DAYS, 7, 365);
}

function rateLimitRetentionDays() {
  return boundedDays(process.env.RUNES_RATE_LIMIT_RETENTION_DAYS, DEFAULT_RATE_LIMIT_RETENTION_DAYS, 2, 14);
}

function boundedDays(value, fallback, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(Math.max(Math.floor(number), min), max) : fallback;
}

function forwardedIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || String(req.socket?.remoteAddress || "").slice(0, 100);
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function streamToText(stream) {
  const response = new Response(stream);
  return response.text();
}

module.exports = {
  buildReadingLog,
  clientFingerprint,
  deleteReadingByOwner,
  deleteReadingLog,
  hashDeletionToken,
  listReadingLogs,
  purgeExpiredData,
  rateLimitRetentionDays,
  retentionDays,
  saveReadingLog
};
