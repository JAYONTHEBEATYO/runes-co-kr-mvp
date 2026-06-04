# Multilingual Translation Workflow

## Goal

Use LLM-assisted translation without weakening the site's factual policy.

The Korean source remains the canonical editorial base. Other languages are localized from Korean with a glossary and structured JSON output.

## Supported Initial Locales

- `en`: English
- `ja`: Japanese
- `zh-Hans`: Simplified Chinese
- `zh-Hant`: Traditional Chinese
- `es`: Spanish
- `fr`: French

Configuration file: `content/translation.config.json`

## Translation Command

```powershell
$env:OPENAI_API_KEY = "<set locally, never commit>"
node tools\translate-rune-content.mjs en
node tools\translate-rune-content.mjs ja
node tools\translate-rune-content.mjs zh-Hans
```

The script writes locale DB files into:

```text
content/locales/elder-futhark.<locale>.json
```

## Safety Rules

- Keep rune IDs, symbols, order, Latin rune names, sound, and aett unchanged.
- Translate visible explanation fields only.
- Do not introduce reversed rune, merkstave, or shadow interpretation as the default.
- Do not overclaim that modern rune divination is proven as an ancient standardized fortune-telling system.
- Do not produce medical, legal, investment, or diagnosis-style advice.
- Keep translation output as JSON through OpenAI Structured Outputs.

## Editorial QA

Before publishing a locale:

1. Check JSON parse validity.
2. Compare rune count against Korean DB: must be 24.
3. Spot-check Fehu, Thurisaz, Perthro, Algiz, Othala because these are more prone to overstatement or cultural misuse.
4. Check that all local pages have canonical/hreflang strategy before exposing in sitemap.
5. Add translated pages to `sitemap.xml` only after human QA.

## API Key Policy

Never place OpenAI API keys in:

- `app.js`
- HTML files
- public JSON files
- GitHub commits
- browser localStorage

Use local shell environment variables or Vercel project environment variables only.
