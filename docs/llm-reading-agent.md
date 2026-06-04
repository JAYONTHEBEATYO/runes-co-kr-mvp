# LLM Reading Agent

## Endpoint

```text
POST /api/rune-reading
```

The browser sends:

- `question`
- `topic`
- `spread`
- `positions`
- selected `runes`

The serverless function loads:

- `content/elder-futhark.ko.json`
- `content/rag/rune-reading-agent.ko.json`

Then it calls the Gemini API and returns:

```json
{
  "reading": "...",
  "model": "gemini-2.5-flash",
  "provider": "gemini",
  "source": "runes-reading-agent-ko"
}
```

## Required Vercel Environment Variables

```text
GEMINI_API_KEY
GEMINI_READING_MODEL
```

`GEMINI_READING_MODEL` is optional. Default:

```text
gemini-2.5-flash
```

## Safety Policy

The agent prompt enforces:

- Upright Elder Futhark meanings only.
- No reversed rune, merkstave, or shadow interpretation.
- No medical, legal, investment, or safety-critical advice.
- No deterministic prediction about another person's feelings, health, money, or future outcome.
- Reading as symbolic reflection and action planning, not absolute prophecy.

## Current Fallback

If the API key is absent or the Gemini call fails, the frontend catches the error and displays the local fallback synthesis.

This keeps the free reading page usable while API setup is pending.

## Production Hardening To Add Later

- Request rate limiting by IP/session.
- Abuse logging.
- Optional moderation layer for harmful questions.
- Paid tier quota logic.
- Server-side storage only after privacy policy is published.
