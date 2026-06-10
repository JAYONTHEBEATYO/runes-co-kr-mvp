# 타저씨 통합엔진 연동 메모

작성일: 2026-06-11

## 적용 위치

- `api/rune-reading.js`
- `api/tajussi-status.js`

룬스 무료 리딩은 브라우저에서 타저씨 API를 직접 호출하지 않는다. 사용자의 생년월일, 태어난 시간, 성별, 출생지 좌표가 충분할 때만 서버리스 API 안에서 타저씨 통합엔진을 호출하고, Gemini 룬 리딩 프롬프트의 보조 컨텍스트로 넣는다.

## 필요한 환경변수

```text
TAJUSSI_API_URL=https://tajussi-api.startarot.co.kr
TAJUSSI_API_KEY=서비스별 발급 키
```

`TAJUSSI_API_KEY`는 절대 브라우저, 프론트엔드 코드, 공개 저장소에 넣지 않는다.

## 호출 조건

다음 값이 모두 있을 때만 `/api/v1/calculate/compact`를 호출한다.

- 양력 생년월일
- 태어난 시간
- 성별: `male` 또는 `female`
- 출생지 위경도

출생지 위경도는 Google Places 선택값이 있으면 그 값을 쓰고, 없으면 한국 주요 지역명에 대한 대표 좌표 보조 테이블을 사용한다. 좌표를 확정할 수 없거나 성별이 `other`이면 타저씨 호출을 생략하고 기존 룬 리딩으로 진행한다.

## 상태 확인

```text
https://runes.co.kr/api/tajussi-status
```

반환값의 `configured`가 `true`이면 서버에 `TAJUSSI_API_KEY`가 설정된 상태다. `healthOk`는 운영 API의 `/api/v1/health` 호출 결과다.

## 보안 기준

- 브라우저에서 타저씨 API를 직접 호출하지 않는다.
- 키는 Vercel 환경변수에만 넣는다.
- 실패해도 사용자 리딩은 중단하지 않고 룬 리딩으로 폴백한다.
- 타저씨 결과는 의료, 법률, 금융 판단의 근거로 쓰지 않는다.
