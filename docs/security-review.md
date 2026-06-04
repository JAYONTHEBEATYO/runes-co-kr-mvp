# Security Review

Date: 2026-06-05
Site: https://runes.co.kr

## Current Surface

- Static HTML/CSS/JS deployed on Vercel.
- No database, no login, no payment, no user account system.
- Free reading form runs in browser and falls back locally if `/api/rune-reading` is absent.
- No Gemini, OpenAI, or Vercel secret is stored in repository files.

## Implemented Controls

- HTML escaping for user question, rune DB fields, and LLM response before rendering into `innerHTML`.
- Removed inline JavaScript event handler from the print button.
- Added global response headers in `vercel.json`:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` blocking camera, microphone, geolocation, payment, USB, magnetometer, and gyroscope.
- Added `robots.txt`, `sitemap.xml`, `llms.txt`, and `ai.txt`.
- Added IndexNow key file and submission script.

## Reviewed Risks

### XSS

Risk: The client renders result HTML dynamically.

Mitigation: All dynamic fields that enter result HTML are escaped through `escapeHtml()`. The remaining `innerHTML` use is template assembly from trusted code plus escaped values.

Residual risk: If a future editor loads untrusted CMS content into the rune DB without sanitization, it must still pass through escaping or a sanitizer.

### API Key Exposure

Risk: LLM translation or reading generation can leak API keys if called directly from browser code.

Mitigation: The reading endpoint reads `GEMINI_API_KEY` only from server-side environment variables. Translation tooling reads `OPENAI_API_KEY` only from the process environment. Client code does not include provider keys.

Residual risk: `/api/rune-reading` must keep the Gemini key only in Vercel environment variables and should add rate limiting before paid launch.

### Clickjacking

Mitigation: `frame-ancestors 'none'` and `X-Frame-Options: DENY`.

### Transport Security

Mitigation: HSTS with one-year max age and subdomain coverage.

### External Links

Mitigation: Source links opened with `target="_blank"` use `rel="noopener"`.

### Dependency Vulnerabilities

Risk: None currently from package dependencies because the site has no `package.json` dependency tree.

Residual risk: Any future Next.js, CMS, payment, or auth dependency must be audited with `npm audit`, lockfile review, and deployment environment isolation.

## Required Before Paid Launch

- Rotate the Vercel token previously pasted in chat.
- Add server-side rate limiting for any future LLM endpoint.
- Add abuse logging for repeated LLM calls.
- Add privacy policy before collecting emails, names, birth data, questions, photos, or payment data.
- Add a refund/commerce policy before selling kits, PDFs, or courses.
- Keep Gemini, OpenAI, payment, courier, and admin keys only in Vercel environment variables.
- Do not expose private PDF archives or RAG source files under the public web root.
