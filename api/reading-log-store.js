const crypto = require("node:crypto");

const LOG_PREFIX = "reading-logs/";
const MAX_LIST_LIMIT = 100;

function hasBlobStorage() {
  return Boolean(String(process.env.BLOB_READ_WRITE_TOKEN || "").trim());
}

function createReadingId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return crypto.randomBytes(16).toString("hex");
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
  model
}) {
  const createdAt = new Date();
  const id = createReadingId();
  return {
    id,
    createdAt: createdAt.toISOString(),
    request: {
      ip: forwardedIp(req),
      userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
      referer: String(req.headers.referer || req.headers.referrer || "").slice(0, 300)
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
  const result = await list({
    prefix: LOG_PREFIX,
    limit: Math.min(Math.max(Number(limit) || 50, 1), MAX_LIST_LIMIT),
    cursor
  });
  const blobs = [...result.blobs].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
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
  return { configured: true, logs, cursor: result.cursor || null, hasMore: Boolean(result.hasMore) };
}

function forwardedIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || String(req.socket?.remoteAddress || "").slice(0, 100);
}

async function streamToText(stream) {
  const response = new Response(stream);
  return response.text();
}

module.exports = {
  buildReadingLog,
  listReadingLogs,
  saveReadingLog
};
