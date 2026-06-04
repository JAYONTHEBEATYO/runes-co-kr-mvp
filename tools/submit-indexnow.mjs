import fs from "node:fs";

const host = "runes.co.kr";
const key = process.argv[2];

if (!key) {
  console.error("Usage: node tools/submit-indexnow.mjs <indexnow-key>");
  process.exit(1);
}

const sitemap = fs.readFileSync("sitemap.xml", "utf8");
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList
  })
});

console.log(JSON.stringify({
  status: response.status,
  statusText: response.statusText,
  submitted: urlList.length
}, null, 2));

if (![200, 202].includes(response.status)) {
  console.error(await response.text());
  process.exit(1);
}
