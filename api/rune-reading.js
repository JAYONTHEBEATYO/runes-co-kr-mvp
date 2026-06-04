const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const MAX_QUESTION_LENGTH = 500;
const ALLOWED_TOPICS = new Set(["general", "love", "work", "money", "self", "choice"]);
const ALLOWED_SPREADS = new Set([1, 3, 5]);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function getBody(req) {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return req.body || {};
}

function cleanText(value, maxLength = MAX_QUESTION_LENGTH) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function selectRuneContext(requestRunes, runeDb) {
  const byId = new Map(runeDb.runes.map((rune) => [rune.id, rune]));
  return requestRunes
    .map((rune) => byId.get(rune.id))
    .filter(Boolean)
    .map((rune) => ({
      id: rune.id,
      order: rune.order,
      symbol: rune.symbol,
      name: rune.name,
      ko: rune.ko,
      sound: rune.sound,
      aett: rune.aett,
      keywords: rune.keywords,
      upright: rune.upright,
      question: rune.question
    }));
}

function buildPrompt({ question, topic, spread, positions, runes, agentContext }) {
  return [
    "너는 runes.co.kr의 한국어 룬 리딩 서브에이전트다.",
    "사용자에게는 부드럽고 유려한 한국어로 답하되, 불안을 키우거나 예언을 단정하지 않는다.",
    "반드시 제공된 RAG 컨텍스트와 뽑힌 룬 정보만 근거로 사용한다.",
    "역방향, merkstave, 그림자 해석은 사용하지 않는다.",
    "의료, 법률, 투자, 안전 문제에 대한 확정 조언은 하지 않는다.",
    "상대의 속마음이나 미래 결과를 확정하지 말고, 질문자가 확인할 수 있는 현실 단서와 행동으로 연결한다.",
    "",
    "[RAG 컨텍스트]",
    JSON.stringify(agentContext, null, 2),
    "",
    "[리딩 입력]",
    JSON.stringify({
      topic,
      question,
      spread,
      positions,
      runes
    }, null, 2),
    "",
    "[출력 지시]",
    "마크다운 기호를 과하게 쓰지 말고, 웹 결과지에 바로 들어갈 수 있는 한국어 문단으로 작성한다.",
    "분량은 900~1400자 정도로 한다.",
    "구성은 제목, 전체 요약, 위치별 해석, 종합 흐름, 오늘의 실천, 주의할 점 순서로 쓴다.",
    "각 위치별 해석에서는 위치명과 룬 이름을 반드시 언급한다.",
    "마지막에는 사용자가 오늘 바로 할 수 있는 작고 구체적인 행동을 제안한다."
  ].join("\n");
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: "OPENAI_API_KEY is not configured" }));
    return;
  }

  try {
    const body = getBody(req);
    const topic = ALLOWED_TOPICS.has(body.topic) ? body.topic : "general";
    const spread = Number(body.spread);
    const question = cleanText(body.question) || "지금 내가 가장 먼저 바라봐야 할 흐름은 무엇인가요?";
    const positions = Array.isArray(body.positions) ? body.positions.map((item) => cleanText(item, 40)).slice(0, 5) : [];
    const requestRunes = Array.isArray(body.runes) ? body.runes.slice(0, 5) : [];

    if (!ALLOWED_SPREADS.has(spread) || requestRunes.length !== spread) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Invalid spread or rune count" }));
      return;
    }

    const runeDb = readJson("content/elder-futhark.ko.json");
    const agentContext = readJson("content/rag/rune-reading-agent.ko.json");
    const runes = selectRuneContext(requestRunes, runeDb);

    if (runes.length !== spread) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Invalid rune selection" }));
      return;
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_READING_MODEL || "gpt-4.1-mini",
        input: buildPrompt({ question, topic, spread, positions, runes, agentContext }),
        max_output_tokens: 1400,
        text: {
          format: { type: "text" },
          verbosity: "medium"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.statusCode = 502;
      res.end(JSON.stringify({ error: "OpenAI response failed", detail: errorText.slice(0, 500) }));
      return;
    }

    const data = await response.json();
    const reading = extractOutputText(data);

    if (!reading) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: "Empty model response" }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({
      reading,
      model: process.env.OPENAI_READING_MODEL || "gpt-4.1-mini",
      source: "runes-reading-agent-ko"
    }));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Rune reading failed", detail: String(error.message || error).slice(0, 300) }));
  }
};
