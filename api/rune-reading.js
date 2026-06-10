const runeDb = require("../content/elder-futhark.ko.json");
const agentContext = require("../content/rag/rune-reading-agent.ko.json");

const MAX_QUESTION_LENGTH = 500;
const ALLOWED_TOPICS = new Set(["general", "love", "work", "money", "self", "choice"]);
const ALLOWED_SPREADS = new Set([1, 3, 5, 7, 9]);
const ALLOWED_GENDERS = new Set(["female", "male", "other"]);
const DEFAULT_MODEL = "gemini-2.5-flash";
const ZODIAC = [
  { sign: "Capricorn", ko: "염소자리", element: "earth", mode: "cardinal", start: [12, 22], end: [1, 19], tone: "현실성, 책임, 장기적인 성취" },
  { sign: "Aquarius", ko: "물병자리", element: "air", mode: "fixed", start: [1, 20], end: [2, 18], tone: "독립성, 관점 전환, 네트워크" },
  { sign: "Pisces", ko: "물고기자리", element: "water", mode: "mutable", start: [2, 19], end: [3, 20], tone: "감수성, 직감, 경계의 흐림" },
  { sign: "Aries", ko: "양자리", element: "fire", mode: "cardinal", start: [3, 21], end: [4, 19], tone: "시작, 추진력, 즉각적인 결단" },
  { sign: "Taurus", ko: "황소자리", element: "earth", mode: "fixed", start: [4, 20], end: [5, 20], tone: "안정, 소유, 감각적인 현실감" },
  { sign: "Gemini", ko: "쌍둥이자리", element: "air", mode: "mutable", start: [5, 21], end: [6, 21], tone: "정보, 이동, 말과 선택지" },
  { sign: "Cancer", ko: "게자리", element: "water", mode: "cardinal", start: [6, 22], end: [7, 22], tone: "보호, 집, 정서적 안전" },
  { sign: "Leo", ko: "사자자리", element: "fire", mode: "fixed", start: [7, 23], end: [8, 22], tone: "표현, 자존감, 주도권" },
  { sign: "Virgo", ko: "처녀자리", element: "earth", mode: "mutable", start: [8, 23], end: [9, 22], tone: "정리, 분석, 생활의 개선" },
  { sign: "Libra", ko: "천칭자리", element: "air", mode: "cardinal", start: [9, 23], end: [10, 23], tone: "균형, 관계, 선택의 조율" },
  { sign: "Scorpio", ko: "전갈자리", element: "water", mode: "fixed", start: [10, 24], end: [11, 22], tone: "몰입, 소유와 상실, 깊은 전환" },
  { sign: "Sagittarius", ko: "사수자리", element: "fire", mode: "mutable", start: [11, 23], end: [12, 21], tone: "확장, 이동, 의미 탐색" }
];
const ELEMENT_KO = { fire: "불", earth: "흙", air: "공기", water: "물" };
const MODE_KO = { cardinal: "시작", fixed: "고정", mutable: "변화" };
const DEFAULT_TAJUSSI_API_URL = "https://tajussi-api.startarot.co.kr";
const KOREA_PLACE_COORDS = [
  { match: /서울|강남|성수|종로|마포|서초|송파|용산|영등포/, lat: 37.5665, lng: 126.9780, label: "서울특별시" },
  { match: /부산|해운대|수영|동래/, lat: 35.1796, lng: 129.0756, label: "부산광역시" },
  { match: /대구/, lat: 35.8714, lng: 128.6014, label: "대구광역시" },
  { match: /인천/, lat: 37.4563, lng: 126.7052, label: "인천광역시" },
  { match: /광주/, lat: 35.1595, lng: 126.8526, label: "광주광역시" },
  { match: /대전/, lat: 36.3504, lng: 127.3845, label: "대전광역시" },
  { match: /울산/, lat: 35.5384, lng: 129.3114, label: "울산광역시" },
  { match: /세종/, lat: 36.4800, lng: 127.2890, label: "세종특별자치시" },
  { match: /수원/, lat: 37.2636, lng: 127.0286, label: "경기도 수원시" },
  { match: /분당|성남/, lat: 37.3827, lng: 127.1189, label: "경기도 성남시" },
  { match: /고양|일산/, lat: 37.6584, lng: 126.8320, label: "경기도 고양시" },
  { match: /용인/, lat: 37.2411, lng: 127.1776, label: "경기도 용인시" },
  { match: /춘천/, lat: 37.8813, lng: 127.7298, label: "강원특별자치도 춘천시" },
  { match: /강릉/, lat: 37.7519, lng: 128.8761, label: "강원특별자치도 강릉시" },
  { match: /청주/, lat: 36.6424, lng: 127.4890, label: "충청북도 청주시" },
  { match: /충주/, lat: 36.9910, lng: 127.9259, label: "충청북도 충주시" },
  { match: /괴산/, lat: 36.8154, lng: 127.7866, label: "충청북도 괴산군" },
  { match: /천안/, lat: 36.8151, lng: 127.1139, label: "충청남도 천안시" },
  { match: /전주/, lat: 35.8242, lng: 127.1480, label: "전북특별자치도 전주시" },
  { match: /목포/, lat: 34.8118, lng: 126.3922, label: "전라남도 목포시" },
  { match: /여수/, lat: 34.7604, lng: 127.6622, label: "전라남도 여수시" },
  { match: /포항/, lat: 36.0190, lng: 129.3435, label: "경상북도 포항시" },
  { match: /경주/, lat: 35.8562, lng: 129.2247, label: "경상북도 경주시" },
  { match: /창원/, lat: 35.2279, lng: 128.6811, label: "경상남도 창원시" },
  { match: /제주|제주시/, lat: 33.4996, lng: 126.5312, label: "제주특별자치도 제주시" },
  { match: /서귀포/, lat: 33.2541, lng: 126.5601, label: "제주특별자치도 서귀포시" }
];

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

function buildAstrologyContext(value) {
  if (!value || typeof value !== "object") return null;
  const birthDate = cleanText(value.birthDate, 20);
  const birthTime = cleanText(value.birthTime, 20);
  const genderRaw = cleanText(value.gender, 20);
  const gender = ALLOWED_GENDERS.has(genderRaw) ? genderRaw : null;
  const birthPlace = cleanText(value.birthPlace, 80);
  const currentPlace = cleanText(value.currentPlace, 80);
  const birthGeo = cleanPlaceGeo(value.birthGeo);
  const currentGeo = cleanPlaceGeo(value.currentGeo);
  if (!birthDate && !birthTime && !gender && !birthPlace && !currentPlace) return null;

  const dateMatch = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const sun = dateMatch ? sunSignFor(Number(dateMatch[2]), Number(dateMatch[3])) : null;

  return {
    calendar: "solar",
    birthDate: birthDate || null,
    birthTime: birthTime || null,
    gender,
    genderKo: gender ? genderLabel(gender) : null,
    birthPlace: birthPlace || null,
    currentPlace: currentPlace || null,
    birthGeo,
    currentGeo,
    precision: birthTime ? "birth-date-time-provided" : "birth-date-only",
    note: birthTime
      ? "1차 개인화는 양력 생일 기반 태양 별자리 중심이다. 출생 시간과 지역은 사용자가 제공했지만 ASC/하우스 계산은 아직 기본 결과에 단정적으로 쓰지 않는다."
      : "출생 시간이 없으므로 ASC, 하우스, 달 별자리를 단정하지 않는다. 양력 생일 기반 태양 별자리만 가볍게 참고한다.",
    sun: sun ? {
      sign: sun.sign,
      ko: sun.ko,
      element: sun.element,
      elementKo: ELEMENT_KO[sun.element],
      mode: sun.mode,
      modeKo: MODE_KO[sun.mode],
      tone: sun.tone
    } : null
  };
}

function genderLabel(value) {
  return {
    female: "여성",
    male: "남성",
    other: "직접 입력 / 기타"
  }[value] || null;
}

function cleanPlaceGeo(value) {
  if (!value || typeof value !== "object") return null;
  const placeId = cleanText(value.placeId, 140);
  const formattedAddress = cleanText(value.formattedAddress, 180);
  const lat = cleanText(value.lat, 30);
  const lng = cleanText(value.lng, 30);
  const provider = cleanText(value.provider, 40);
  if (!placeId && !formattedAddress && !lat && !lng) return null;
  return { placeId: placeId || null, formattedAddress: formattedAddress || null, lat: lat || null, lng: lng || null, provider: provider || "manual" };
}

function buildTajussiPayload(astrology) {
  if (!astrology?.birthDate || !astrology?.birthTime) return null;
  if (!["male", "female"].includes(astrology.gender)) return null;

  const dateMatch = astrology.birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = astrology.birthTime.match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;

  const coord = resolveBirthCoordinate(astrology);
  if (!coord) return null;

  return {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
    gender: astrology.gender,
    timezone: "Asia/Seoul",
    latitude: coord.lat,
    longitude: coord.lng,
    calendar: "solar",
    isLeapMonth: false,
    jasiMethod: "split",
    place: {
      label: astrology.birthPlace || coord.label || "대한민국",
      country: "대한민국",
      address: astrology.birthGeo?.formattedAddress || astrology.birthPlace || coord.label || ""
    }
  };
}

function resolveBirthCoordinate(astrology) {
  const geoLat = Number(astrology.birthGeo?.lat);
  const geoLng = Number(astrology.birthGeo?.lng);
  if (Number.isFinite(geoLat) && Number.isFinite(geoLng)) {
    return { lat: geoLat, lng: geoLng, label: astrology.birthGeo?.formattedAddress || astrology.birthPlace || "" };
  }
  const text = [astrology.birthPlace, astrology.birthGeo?.formattedAddress].filter(Boolean).join(" ");
  const fallback = KOREA_PLACE_COORDS.find((item) => item.match.test(text));
  if (!fallback) return null;
  return { lat: fallback.lat, lng: fallback.lng, label: fallback.label };
}

async function fetchTajussiContext(astrology) {
  const apiKey = String(process.env.TAJUSSI_API_KEY || "").trim();
  if (!apiKey) return null;
  const payload = buildTajussiPayload(astrology);
  if (!payload) return null;

  const baseUrl = String(process.env.TAJUSSI_API_URL || DEFAULT_TAJUSSI_API_URL).replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/api/v1/calculate/compact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tajussi-Api-Key": apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Tajussi API ${response.status}: ${detail.slice(0, 300)}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return summarizeTajussiData(data, payload);
}

function summarizeTajussiData(data, payload) {
  return {
    source: "tajussi-api",
    input: {
      calendar: payload.calendar,
      gender: payload.gender,
      timezone: payload.timezone,
      place: payload.place?.label || payload.place?.address || null,
      latitude: payload.latitude,
      longitude: payload.longitude
    },
    summary: pickCompactFields(data)
  };
}

function pickCompactFields(value, depth = 0) {
  if (value == null || depth > 4) return value;
  if (Array.isArray(value)) return value.slice(0, 8).map((item) => pickCompactFields(item, depth + 1));
  if (typeof value !== "object") return value;

  const preferred = [
    "ok", "summary", "fusion", "reading", "manse", "saju", "astrology", "westernAstrology",
    "ziwei", "numerology", "soulCard", "solar", "lunar", "pillars", "tenGods", "elements",
    "zodiac", "sun", "moon", "ascendant", "houses", "majorAspects", "keywords", "advice"
  ];
  const entries = Object.entries(value);
  const selected = entries.filter(([key]) => preferred.includes(key)).slice(0, 18);
  const source = selected.length ? selected : entries.slice(0, 18);
  return Object.fromEntries(source.map(([key, item]) => [key, pickCompactFields(item, depth + 1)]));
}

function sunSignFor(month, day) {
  return ZODIAC.find((item) => {
    const [sm, sd] = item.start;
    const [em, ed] = item.end;
    if (sm <= em) {
      return (month > sm || (month === sm && day >= sd)) && (month < em || (month === em && day <= ed));
    }
    return (month > sm || (month === sm && day >= sd)) || (month < em || (month === em && day <= ed));
  }) || null;
}

function buildPrompt({ question, topic, spread, spreadKey, spreadTitle, positions, runes, astrology, tajussi, agentContext }) {
  return [
    "너는 runes.co.kr의 한국어 룬 리딩 서브에이전트다.",
    "사용자에게는 부드럽고 유려한 한국어로 답하되, 불안을 키우거나 예언을 단정하지 않는다.",
    "반드시 제공된 RAG 컨텍스트와 뽑힌 룬 정보만 근거로 사용한다.",
    "별자리 개인화 정보가 있으면 룬 해석을 보조하는 부드러운 문맥으로만 사용한다.",
    "타저씨 통합엔진 데이터가 있으면 사주, 만세력, 서양 점성술, 수비학 등 통합 데이터의 큰 경향만 참고한다.",
    "타저씨 통합엔진 데이터가 없으면 없다고 말하지 말고 제공된 룬과 기본 별자리 개인화만으로 자연스럽게 해석한다.",
    "양력 생일만 있는 경우 태양 별자리만 언급하고, ASC·하우스·달 별자리는 단정하지 않는다.",
    "성별 정보는 사용자가 제공한 자기 식별 정보로만 참고하고, 성별 고정관념이나 역할 단정으로 해석하지 않는다.",
    "역방향, merkstave, 그림자 해석은 사용하지 않는다.",
    "의료, 법률, 투자, 안전 문제에 대한 확정 조언은 하지 않는다.",
    "상대의 속마음이나 미래 결과를 확정하지 말고, 질문자가 확인할 수 있는 현실 단서와 행동으로 연결한다.",
    "",
    "[RAG 컨텍스트]",
    JSON.stringify(agentContext, null, 2),
    "",
    "[리딩 입력]",
    JSON.stringify({ topic, question, spread, spreadKey, spreadTitle, positions, runes, astrology, tajussi }, null, 2),
    "",
    "[출력 지시]",
    "마크다운 문법을 쓰지 않는다. #, ##, **, -, bullet 기호를 사용하지 않는다.",
    "웹 결과지에 바로 들어갈 수 있는 평문 한국어 문단으로 작성한다.",
    "분량은 9룬 기준 1800~2400자, 7룬 기준 1500~2100자, 5룬 기준 1200~1800자, 3룬 기준 900~1300자, 1룬 기준 600~900자로 한다.",
    "구성은 짧은 제목, 전체 요약, 별자리 개인화가 있으면 1문단 요약, 위치별 해석, 종합 흐름, 오늘의 실천, 주의할 점 순서로 쓴다.",
    "각 위치별 해석에서는 위치명과 룬 이름을 반드시 언급한다. 7룬과 9룬은 모든 자리를 길게 반복하지 말고 핵심 패턴과 반복 키워드를 묶어 읽는다.",
    "마지막에는 사용자가 오늘 바로 할 수 있는 작고 구체적인 행동을 제안한다."
  ].join("\n");
}

function extractGeminiText(data) {
  const parts = [];
  for (const candidate of data.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.text) parts.push(part.text);
    }
  }
  return parts.join("\n").trim();
}

async function callGemini(prompt) {
  const model = process.env.GEMINI_READING_MODEL || DEFAULT_MODEL;
  const apiKey = String(process.env.GEMINI_API_KEY || "").replace(/^\uFEFF/, "").trim();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const body = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.65,
      topP: 0.9,
      maxOutputTokens: 3200,
      thinkingConfig: {
        thinkingBudget: 0
      }
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
    ]
  });

  let response;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body
    });
    if (![500, 502, 503, 504].includes(response.status)) break;
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 650));
  }

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText.slice(0, 800));
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return {
    reading: extractGeminiText(data),
    model
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  if (!String(process.env.GEMINI_API_KEY || "").replace(/^\uFEFF/, "").trim()) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }));
    return;
  }

  try {
    const body = getBody(req);
    const topic = ALLOWED_TOPICS.has(body.topic) ? body.topic : "general";
    const spread = Number(body.spread);
    const spreadKey = cleanText(body.spreadKey, 40);
    const spreadTitle = cleanText(body.spreadTitle, 60);
    const question = cleanText(body.question) || "지금 내가 가장 먼저 바라봐야 할 흐름은 무엇인가요?";
    const positions = Array.isArray(body.positions) ? body.positions.map((item) => cleanText(item, 40)).slice(0, 9) : [];
    const requestRunes = Array.isArray(body.runes) ? body.runes.slice(0, 9) : [];
    const astrology = buildAstrologyContext(body.astrology);

    if (!ALLOWED_SPREADS.has(spread) || requestRunes.length !== spread) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Invalid spread or rune count" }));
      return;
    }

    const runes = selectRuneContext(requestRunes, runeDb);

    if (runes.length !== spread) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Invalid rune selection" }));
      return;
    }

    let tajussi = null;
    if (astrology) {
      try {
        tajussi = await fetchTajussiContext(astrology);
      } catch (error) {
        console.info("Tajussi context unavailable; continuing with rune-only reading.", error);
      }
    }

    const prompt = buildPrompt({ question, topic, spread, spreadKey, spreadTitle, positions, runes, astrology, tajussi, agentContext });
    const { reading, model } = await callGemini(prompt);

    if (!reading) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: "Empty Gemini response" }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({
      reading,
      model,
      provider: "gemini",
      source: "runes-reading-agent-ko",
      astrology,
      tajussi: tajussi ? { source: tajussi.source, enabled: true } : { enabled: false }
    }));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.end(JSON.stringify({
      error: "Gemini rune reading failed",
      detail: String(error.message || error).slice(0, 500)
    }));
  }
};
