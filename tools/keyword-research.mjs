import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "docs", "keyword-research");
fs.mkdirSync(outDir, { recursive: true });

const seeds = [
  "룬",
  "룬 문자",
  "룬문자",
  "룬스톤",
  "룬 점술",
  "룬 리딩",
  "엘더 푸사르크",
  "푸사르크",
  "바이킹 룬",
  "북유럽 룬",
  "rune",
  "runes",
  "rune meaning",
  "rune reading",
  "rune casting",
  "elder futhark",
  "futhark runes",
  "rune stones",
  "bind runes"
];

const manualKoreanKeywords = [
  "룬 뜻",
  "룬 문자 뜻",
  "룬문자 뜻",
  "룬 문자 해석",
  "룬 문자 종류",
  "룬 문자 변환",
  "룬 문자 번역기",
  "룬 문자 타투",
  "룬스톤 뜻",
  "룬스톤 사용법",
  "룬스톤 점술",
  "룬스톤 뽑는 법",
  "룬스톤 던지는 법",
  "룬스톤 세트",
  "룬스톤 구매",
  "룬스톤 키트",
  "룬 점술 방법",
  "룬 리딩 방법",
  "룬 리딩 질문",
  "룬 리딩 스프레드",
  "룬 캐스팅",
  "룬 캐스팅 천",
  "룬 카드",
  "룬 오라클 카드",
  "엘더 푸사르크 뜻",
  "엘더 푸사르크 24룬",
  "엘더 푸사르크 룬 문자",
  "영거 푸사르크",
  "엘더 푸사르크 영거 푸사르크 차이",
  "바이킹 룬 문자",
  "북유럽 룬 문자",
  "고대 룬 문자",
  "빈 룬",
  "25번째 룬",
  "바인드 룬",
  "룬 문자 점술 사전"
];

const ignorePatterns = [
  /runescape/i,
  /rune factory/i,
  /runext/i,
  /r u next/i,
  /runerigus/i,
  /runelite/i,
  /board game/i,
  /game$/i,
  /게임/i,
  /점술가\s*길드/i,
  /비전\s*룬/i,
  /로스트아크/i,
  /메이플/i,
  /와우/i,
  /월드 오브 워크래프트/i,
  /디아블로/i,
  /엘든링/i,
  /발더스/i,
  /원신/i,
  /마비노기/i,
  /오블리비언/i,
  /runes mod/i,
  /runeforge/i,
  /rune slayer/i,
  /runesua/i,
  /runespirit/i
];

function normalizeKeyword(value) {
  return String(value || "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

function isRelevant(keyword) {
  if (!keyword) return false;
  if (ignorePatterns.some((pattern) => pattern.test(keyword))) return false;
  return /(룬|푸사르크|futhark|rune|runic|bind rune)/i.test(keyword);
}

async function fetchGoogleSuggest(seed, hl = "ko", gl = "KR") {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${hl}&gl=${gl}&q=${encodeURIComponent(seed)}`;
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`Google suggest ${response.status}`);
  const data = await response.json();
  return (data[1] || []).map((keyword) => ({
    source: `google_suggest_${hl}_${gl}`,
    seed,
    keyword: normalizeKeyword(keyword)
  }));
}

async function fetchNaverSuggest(seed) {
  const url = `https://ac.search.naver.com/nx/ac?q=${encodeURIComponent(seed)}&con=0&frm=nv&ans=2&r_format=json&r_enc=UTF-8&st=100`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      referer: "https://search.naver.com/"
    }
  });
  if (!response.ok) throw new Error(`Naver suggest ${response.status}`);
  const data = await response.json();
  const rows = data?.items?.[0] || [];
  return rows.map((row) => ({
    source: "naver_ac",
    seed,
    keyword: normalizeKeyword(Array.isArray(row) ? row[0] : row)
  }));
}

function classifyIntent(keyword) {
  const k = keyword.toLowerCase();
  if (/(사용법|how to use|how to read|방법|guide|reading guide|뽑는|던지는|spreads|layouts|methods)/i.test(keyword)) {
    return "how_to";
  }
  if (/(뜻|meaning|meanings|해석|chart|list|alphabet|symbols|24룬)/i.test(keyword)) {
    return "meaning_lookup";
  }
  if (/(구매|세트|키트|for sale|set|cloth|mat|board|card|cards|app|book|pdf)/i.test(keyword)) {
    return "commercial";
  }
  if (/(타투|tattoo|bind|바인드|generator|font|copy paste|translator|번역기|변환)/i.test(keyword)) {
    return "utility_or_creation";
  }
  if (/(역사|고대|바이킹|북유럽|elder|younger|futhark|푸사르크|tacitus|rune poem)/i.test(keyword)) {
    return "history_factcheck";
  }
  if (/(점술|리딩|reading|casting|divination|oracle)/i.test(keyword)) {
    return "divination";
  }
  if (k.includes("love") || /(관계|연애|돈|money|strength|사랑)/i.test(keyword)) {
    return "use_case";
  }
  return "general";
}

function clusterKeyword(keyword) {
  const k = keyword.toLowerCase();
  if (/(룬스톤|rune stones|runestone)/i.test(keyword)) return "rune_stones";
  if (/(캐스팅|casting|cloth|mat|board|던지는)/i.test(keyword)) return "casting";
  if (/(리딩|reading|점술|divination|oracle|spreads|layouts)/i.test(keyword)) return "reading";
  if (/(엘더|푸사르크|futhark|24룬|alphabet|pronunciation)/i.test(keyword)) return "elder_futhark";
  if (/(바인드|bind)/i.test(keyword)) return "bind_runes";
  if (/(타투|tattoo|font|copy paste|translator|번역기|변환)/i.test(keyword)) return "tools_tattoo";
  if (/(뜻|meaning|해석|symbols|chart|list)/i.test(keyword)) return "meanings";
  if (/(고대|바이킹|북유럽|history|rune poem|tacitus)/i.test(keyword)) return "history";
  return "general";
}

function scoreKeyword(item) {
  const keyword = item.keyword;
  let score = 10;
  if (/^[가-힣0-9\s]+$/.test(keyword)) score += 8;
  if (item.source.startsWith("google_suggest")) score += 5;
  if (item.source === "manual_seed") score += 4;
  if (/(사용법|뜻|점술|리딩|캐스팅|엘더 푸사르크|룬스톤)/.test(keyword)) score += 8;
  if (/(free|online|guide|meaning|casting|elder futhark|rune stones)/i.test(keyword)) score += 5;
  if (/(runescape|game|factory)/i.test(keyword)) score -= 100;
  if (keyword.length > 45) score -= 4;
  return score;
}

function makeArticleIdea(keyword, cluster, intent) {
  const map = {
    "룬스톤 사용법": {
      title: "룬스톤 사용법: 처음 산 사람이 바로 따라 하는 7단계",
      slug: "how-to-use-rune-stones",
      type: "pillar"
    },
    "엘더 푸사르크 24룬": {
      title: "엘더 푸사르크 24룬 뜻 표",
      slug: "elder-futhark-24-runes-meaning-chart",
      type: "hub"
    },
    "룬 점술 방법": {
      title: "룬 점술은 어떻게 보나요? 초보자를 위한 룬 리딩 순서",
      slug: "how-rune-divination-works",
      type: "pillar"
    },
    "빈 룬": {
      title: "빈 룬은 진짜 25번째 룬일까?",
      slug: "blank-rune-25th-rune",
      type: "factcheck"
    },
    "바인드 룬": {
      title: "바인드 룬은 마음대로 만들어도 될까?",
      slug: "bind-runes-guide",
      type: "factcheck"
    }
  };
  if (map[keyword]) return map[keyword];

  if (cluster === "rune_stones" && intent === "how_to") {
    return { title: `${keyword}: 초보자가 먼저 알아야 할 사용 순서`, slug: toSlug(keyword), type: "how_to" };
  }
  if (cluster === "elder_futhark") {
    return { title: `${keyword}: 엘더 푸사르크 입문자가 헷갈리는 핵심 정리`, slug: toSlug(keyword), type: "guide" };
  }
  if (cluster === "casting") {
    return { title: `${keyword}: 룬스톤을 던져 읽는 법`, slug: toSlug(keyword), type: "how_to" };
  }
  if (cluster === "meanings") {
    return { title: `${keyword}: 룬 문자 뜻과 해석 기준`, slug: toSlug(keyword), type: "meaning" };
  }
  return { title: `${keyword}: 룬스 초보 가이드`, slug: toSlug(keyword), type: "supporting" };
}

function toSlug(keyword) {
  const roman = keyword
    .toLowerCase()
    .replace(/엘더 푸사르크/g, "elder-futhark")
    .replace(/영거 푸사르크/g, "younger-futhark")
    .replace(/푸사르크/g, "futhark")
    .replace(/룬스톤/g, "rune-stones")
    .replace(/룬 문자/g, "rune-letters")
    .replace(/룬문자/g, "rune-letters")
    .replace(/룬 점술/g, "rune-divination")
    .replace(/룬 리딩/g, "rune-reading")
    .replace(/룬 캐스팅/g, "rune-casting")
    .replace(/룬 카드/g, "rune-cards")
    .replace(/룬 오라클 카드/g, "rune-oracle-cards")
    .replace(/빈 룬/g, "blank-rune")
    .replace(/바인드 룬/g, "bind-runes")
    .replace(/북유럽/g, "norse")
    .replace(/바이킹/g, "viking")
    .replace(/고대/g, "ancient")
    .replace(/룬/g, "rune")
    .replace(/문자/g, "letters")
    .replace(/뜻/g, "meaning")
    .replace(/해석/g, "interpretation")
    .replace(/해설서/g, "guidebook")
    .replace(/종류/g, "types")
    .replace(/리딩/g, "reading")
    .replace(/점술/g, "divination")
    .replace(/점치는법/g, "divination-method")
    .replace(/보는 법/g, "reading-method")
    .replace(/매뉴얼/g, "manual")
    .replace(/사용법/g, "how-to-use")
    .replace(/방법/g, "method")
    .replace(/질문/g, "questions")
    .replace(/스프레드/g, "spreads")
    .replace(/뽑는 법/g, "drawing-method")
    .replace(/던지는 법/g, "casting-method")
    .replace(/세트/g, "set")
    .replace(/키트/g, "kit")
    .replace(/구매/g, "buying")
    .replace(/번역기/g, "translator")
    .replace(/변환/g, "converter")
    .replace(/타투/g, "tattoo");
  return roman
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function main() {
  const raw = [];
  for (const seed of seeds) {
    for (const fetcher of [
      () => fetchGoogleSuggest(seed, "ko", "KR"),
      () => fetchGoogleSuggest(seed, "en", "US"),
      () => fetchNaverSuggest(seed)
    ]) {
      try {
        raw.push(...await fetcher());
      } catch (error) {
        raw.push({ source: "error", seed, keyword: String(error.message) });
      }
    }
  }
  raw.push(...manualKoreanKeywords.map((keyword) => ({ source: "manual_seed", seed: "manual_ko", keyword })));

  const byKeyword = new Map();
  for (const item of raw) {
    const keyword = normalizeKeyword(item.keyword);
    if (!isRelevant(keyword)) continue;
    const key = keyword.toLowerCase();
    const prev = byKeyword.get(key);
    if (prev) {
      prev.sources = [...new Set([...prev.sources, item.source])];
      prev.seeds = [...new Set([...prev.seeds, item.seed])];
    } else {
      byKeyword.set(key, { keyword, sources: [item.source], seeds: [item.seed] });
    }
  }

  const keywords = [...byKeyword.values()].map((item) => {
    const intent = classifyIntent(item.keyword);
    const cluster = clusterKeyword(item.keyword);
    const idea = makeArticleIdea(item.keyword, cluster, intent);
    return {
      ...item,
      intent,
      cluster,
      score: scoreKeyword({ ...item, source: item.sources[0] }),
      article: idea
    };
  }).sort((a, b) => b.score - a.score || a.keyword.localeCompare(b.keyword));

  const clusters = {};
  for (const item of keywords) {
    clusters[item.cluster] ||= [];
    clusters[item.cluster].push(item.keyword);
  }

  const topIdeas = keywords
    .filter((item) => ["how_to", "meaning_lookup", "divination", "history_factcheck", "commercial", "utility_or_creation"].includes(item.intent))
    .slice(0, 40);

  const result = {
    generated_at: new Date().toISOString(),
    methodology: [
      "Google Suggest ko-KR and en-US",
      "Naver autocomplete where available",
      "Manual Korean seed expansion for low-volume niche terms",
      "Rule-based cluster and intent scoring"
    ],
    caveats: [
      "Autocomplete is not monthly search volume.",
      "Google Trends/Keyword Planner/Search Console are needed for precise volume.",
      "Korean rune terms are niche; English demand should be translated into Korean intent pages."
    ],
    keywords,
    clusters,
    topIdeas
  };

  fs.writeFileSync(path.join(outDir, "rune-keyword-research.json"), JSON.stringify(result, null, 2), "utf8");
  fs.writeFileSync(path.join(outDir, "rune-keyword-research.csv"), toCsv(keywords), "utf8");
  fs.writeFileSync(path.join(outDir, "rune-keyword-research.md"), toMarkdown(result), "utf8");
  console.log(JSON.stringify({
    keywords: keywords.length,
    clusters: Object.keys(clusters).length,
    output: path.relative(root, outDir)
  }, null, 2));
}

function toCsv(rows) {
  const header = ["keyword", "score", "cluster", "intent", "sources", "article_title", "slug"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push([
      row.keyword,
      row.score,
      row.cluster,
      row.intent,
      row.sources.join("|"),
      row.article.title,
      row.article.slug
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toMarkdown(result) {
  const clusterSections = Object.entries(result.clusters)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([cluster, items]) => `### ${cluster}\n\n${items.slice(0, 30).map((item) => `- ${item}`).join("\n")}`)
    .join("\n\n");

  const ideas = result.topIdeas.slice(0, 20).map((item, index) => {
    return `| ${index + 1} | ${item.keyword} | ${item.score} | ${item.cluster} | ${item.intent} | ${item.article.title} |`;
  }).join("\n");

  return `# Rune Keyword Research

Generated: ${result.generated_at}

## Methodology

${result.methodology.map((item) => `- ${item}`).join("\n")}

## Caveats

${result.caveats.map((item) => `- ${item}`).join("\n")}

## Top Article Ideas

| # | Keyword | Score | Cluster | Intent | Article |
|---:|---|---:|---|---|---|
${ideas}

## Clusters

${clusterSections}
`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
