# runes.co.kr 콘텐츠/서비스 구조

## 1. 기본 제품 구조

- 웹 리딩 엔진: 1룬, 3룬, 5룬, 9룬, 질문별 리딩.
- 자체 한국어 룬 DB: Elder Futhark 24룬 기본. Wyrd/Blank는 현대 옵션.
- 자체 이미지: 제품 연출 이미지는 AI 생성, 룬 문자 자체는 SVG/폰트 기반 정확 렌더링.
- QR 연동 실물 키트: 룬스톤/오라클 카드/파우치/가이드북/리딩권.
- PDF 결과지: 브라우저 인쇄 저장 MVP에서 서버 PDF 생성으로 확장.

## 2. 자료 정리 원칙

- 공개 도메인/라이선스 확인 자료: 역사 설명, 문자 체계, 이미지 참고 근거로 사용 가능.
- 현대 저작권 자료: 내부 연구와 주제 비교만 가능. 문장, 도표, 이미지, 카드 의미를 복제하지 않는다.
- 자체 콘텐츠: 모든 룬 해석 문장은 한국어로 새로 작성하고, 출처 자료의 표현 구조를 그대로 따르지 않는다.

## 3. DB 필드 확장안

- `id`, `order`, `symbol`, `unicode`, `name`, `ko`, `sound`, `aett`
- `historical_note_ko`
- `oracle_keywords_ko`
- `upright`, `reverse`
- `love`, `work`, `money`, `decision`, `self`
- `yes_no_tendency`
- `pairing_rules`
- `spread_position_modifiers`
- `risk_notes`
- `source_refs`

## 4. 실물 키트 QR 구조

- 키트별 `kit_id`
- 구매자별 `activation_code`
- QR URL: `https://runes.co.kr/kit/{kit_id}?code={activation_code}`
- 제공 기능: 오늘의 룬, 실물 룬 기록, 결과지 저장, PDF 다운로드.
- 확장 기능: 상담사 전용 결과지, 고객 공유 링크, 재구매 쿠폰.

## 5. 우선 개발 순서

1. 24룬 DB 안정화
2. 리딩 엔진과 결과지 템플릿
3. 모바일 첫 화면과 룬 뽑기 UX
4. 관리자용 콘텐츠 편집 구조
5. QR 키트 활성화
6. 실물 키트 상세페이지와 펀딩 페이지
