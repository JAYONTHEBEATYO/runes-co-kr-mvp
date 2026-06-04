import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(root, "content", "translation.config.json"), "utf8"));
const sourceDbPath = path.join(root, "content", "elder-futhark.ko.json");
const sourceDb = JSON.parse(fs.readFileSync(sourceDbPath, "utf8"));
const target = process.argv[2] || "en";
const selectedLocale = config.target_locales.find((locale) => locale.locale === target || locale.dir === target);

if (!selectedLocale) {
  console.error(`Unknown locale: ${target}`);
  console.error(`Available: ${config.target_locales.map((locale) => locale.locale).join(", ")}`);
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is required. Keep it in Vercel/local environment variables, never in client JavaScript.");
  process.exit(1);
}

const model = process.env.OPENAI_MODEL || config.default_model;
const outDir = path.join(root, "content", "locales");
fs.mkdirSync(outDir, { recursive: true });

function chunkRunes(runes, size = 4) {
  const chunks = [];
  for (let i = 0; i < runes.length; i += size) chunks.push(runes.slice(i, i + size));
  return chunks;
}

function translationPrompt(runes) {
  return [
    `You are a professional localization editor for ${selectedLocale.label}.`,
    `Translate Korean rune-divination educational content into ${selectedLocale.label}.`,
    `Tone: ${selectedLocale.tone}.`,
    "Preserve rune ids, order, symbol, Latin rune names, sound, and aett.",
    "Translate ko, keywords, upright, and question fields.",
    "Use the glossary where appropriate:",
    JSON.stringify(config.glossary),
    "Rules:",
    ...config.translation_rules,
    "Source payload:",
    JSON.stringify({
      target_locale: selectedLocale.locale,
      runes
    })
  ].join("\n");
}

async function translateChunk(runes) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      input: translationPrompt(runes),
      text: {
        format: {
          type: "json_schema",
          name: "translated_runes",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["runes"],
            properties: {
              runes: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["id", "order", "symbol", "name", "ko", "sound", "aett", "keywords", "upright", "question"],
                  properties: {
                    id: { type: "string" },
                    order: { type: "number" },
                    symbol: { type: "string" },
                    name: { type: "string" },
                    ko: { type: "string" },
                    sound: { type: "string" },
                    aett: { type: "number" },
                    keywords: {
                      type: "array",
                      items: { type: "string" }
                    },
                    upright: { type: "string" },
                    question: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed.runes)) throw new Error("Expected JSON object with runes array");
  return parsed.runes;
}

const translated = [];
for (const chunk of chunkRunes(sourceDb.runes)) {
  const slimChunk = chunk.map((rune) => ({
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
  const result = await translateChunk(slimChunk);
  translated.push(...result);
  console.log(`Translated ${translated.length}/${sourceDb.runes.length}`);
}

const output = {
  meta: {
    ...sourceDb.meta,
    locale: selectedLocale.locale,
    source_locale: config.source_locale,
    generated_at: new Date().toISOString(),
    model
  },
  runes: translated
};

const outPath = path.join(outDir, `elder-futhark.${selectedLocale.locale}.json`);
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
console.log(`Wrote ${outPath}`);
