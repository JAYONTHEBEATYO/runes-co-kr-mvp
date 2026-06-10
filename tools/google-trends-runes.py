from __future__ import annotations

import json
import time
from pathlib import Path

try:
    from pytrends.request import TrendReq
except Exception as exc:  # pragma: no cover
    raise SystemExit(f"pytrends is not installed or failed to import: {exc}")


ROOT = Path.cwd()
OUT = ROOT / "docs" / "keyword-research"
OUT.mkdir(parents=True, exist_ok=True)


KEYWORD_GROUPS = {
    "ko_core": ["룬 문자", "룬스톤", "룬 점술", "엘더 푸사르크", "룬 리딩"],
    "en_core": ["rune meaning", "rune reading", "rune casting", "elder futhark", "rune stones"],
    "en_commercial": ["rune stones set", "rune casting cloth", "bind runes", "rune translator", "rune tattoo"],
}


def df_to_records(df):
    if df is None or df.empty:
        return []
    reset = df.reset_index()
    rows = []
    for _, row in reset.iterrows():
        item = {}
        for key, value in row.items():
            if hasattr(value, "isoformat"):
                item[str(key)] = value.isoformat()
            elif hasattr(value, "item"):
                item[str(key)] = value.item()
            else:
                item[str(key)] = value
        rows.append(item)
    return rows


def sanitize_error(exc):
    message = str(exc)
    if "too many 429" in message:
        return "Google Trends rate limited the request with too many 429 responses."
    if "trends.google.com" in message:
        return message.split(" url: ", 1)[0]
    return message[:500]


def main():
    result = {
        "generated_at": __import__("datetime").datetime.now().isoformat(),
        "source": "pytrends unofficial Google Trends API",
        "caveat": "Google Trends values are relative interest indexes, not exact search volume.",
        "groups": {},
    }

    for name, keywords in KEYWORD_GROUPS.items():
        group = {"keywords": keywords, "interest_over_time": [], "related_queries": {}, "status": "ok"}
        try:
            pytrends = TrendReq(hl="ko-KR", tz=540, timeout=(10, 25), retries=2, backoff_factor=1.0)
            pytrends.build_payload(keywords, cat=0, timeframe="today 12-m", geo="KR", gprop="")
            group["interest_over_time"] = df_to_records(pytrends.interest_over_time())
            related = pytrends.related_queries() or {}
            for keyword, data in related.items():
                group["related_queries"][keyword] = {
                    "top": df_to_records(data.get("top")),
                    "rising": df_to_records(data.get("rising")),
                }
        except Exception as exc:
            group["status"] = "error"
            group["error"] = sanitize_error(exc)
        result["groups"][name] = group
        time.sleep(3)

    path = OUT / "google-trends-runes.json"
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(path), "groups": list(result["groups"].keys())}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
