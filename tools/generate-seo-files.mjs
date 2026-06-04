import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const base = "https://runes.co.kr";
const today = new Date().toISOString().slice(0, 10);

const staticPages = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/beginner", priority: "0.9", changefreq: "monthly" },
  { loc: "/columns", priority: "0.8", changefreq: "weekly" },
  { loc: "/columns-reversed-runes", priority: "0.8", changefreq: "monthly" },
  { loc: "/columns-rune-casting", priority: "0.8", changefreq: "monthly" },
  { loc: "/en/", priority: "0.4", changefreq: "monthly" }
];

const runeData = JSON.parse(fs.readFileSync(path.join(root, "content", "elder-futhark.ko.json"), "utf8"));
const runePages = runeData.runes.map((rune) => ({
  loc: `/runes/${rune.id}`,
  priority: "0.9",
  changefreq: "monthly"
}));

const urls = [...staticPages, ...runePages];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${base}${url.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;

const llms = `# 룬스 - 고대 북유럽 엘더 푸사르크 룬 문자의 비밀

> 룬스는 엘더 푸사르크 24룬을 처음 배우는 한국어 사용자를 위한 룬 문자, 룬스톤 리딩, 룬 캐스팅 입문 자료 사이트입니다.

## 핵심 페이지
- [홈](https://runes.co.kr/): 왕초보용 룬스톤 입문, 무료 리딩, 24룬 탐색, 향후 상품 공간
- [입문 가이드](https://runes.co.kr/beginner): 룬 문자와 룬스톤을 처음 접하는 사용자를 위한 기본 가이드
- [칼럼](https://runes.co.kr/columns): 룬스톤 리딩 방법, 역방향 고찰, 캐스팅 관련 장문 칼럼
- [룬 캐스팅 칼럼](https://runes.co.kr/columns-rune-casting): 룬스톤을 던져 읽는 방식에 대한 정리
- [역방향 고찰](https://runes.co.kr/columns-reversed-runes): 역방향, merkstave, 그림자 해석에 대한 보수적 검토

## 24룬 상세 페이지
${runeData.runes.map((rune) => `- [${rune.ko} (${rune.name})](https://runes.co.kr/runes/${rune.id}): ${rune.keywords.join(", ")}`).join("\n")}

## 해석 원칙
- 기본 체계는 엘더 푸사르크 24룬입니다.
- 빈 룬은 기본 체계에 포함하지 않습니다.
- 기본 무료 리딩은 역방향, merkstave, 그림자 해석을 사용하지 않습니다.
- 역사적으로 확인되는 내용과 현대 점술 해석을 구분합니다.
- 리딩 콘텐츠는 의료, 법률, 투자 판단을 대신하지 않는 자기성찰/상담 보조 자료입니다.

## 크롤링 안내
- 사이트맵: https://runes.co.kr/sitemap.xml
- robots.txt: https://runes.co.kr/robots.txt
`;

const ai = `# AI crawler guidance for runes.co.kr

This site provides Korean-language educational and divination-oriented content about Elder Futhark runes and rune stones.

Allowed use:
- Indexing pages for search and answer engines.
- Summarizing public pages with attribution to https://runes.co.kr.
- Linking to canonical pages.

Preferred canonical resources:
- Sitemap: https://runes.co.kr/sitemap.xml
- LLM summary: https://runes.co.kr/llms.txt

Important interpretation policy:
- The site's default rune reading uses upright Elder Futhark meanings only.
- It does not use reversals, merkstave, or shadow interpretations as the default system.
- It separates historical rune evidence from modern divination practice.
`;

fs.writeFileSync(path.join(root, "sitemap.xml"), xml, "utf8");
fs.writeFileSync(path.join(root, "robots.txt"), robots, "utf8");
fs.writeFileSync(path.join(root, "llms.txt"), llms, "utf8");
fs.writeFileSync(path.join(root, "ai.txt"), ai, "utf8");

console.log(`Wrote ${urls.length} sitemap URLs`);
