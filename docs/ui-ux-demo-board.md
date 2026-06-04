# runes.co.kr UI/UX 데모 보드

조사일: 2026-06-04

## 결론

`runes.co.kr`은 하나의 템플릿을 그대로 쓰기보다, 아래 5개 UI 계열을 섞는 것이 맞다.

1. 왕초보 가이드/자료실: Fumadocs, Nextra, Mintlify 느낌
2. 룬별 해석 카드/콘텐츠: shadcn/ui, TWBlocks
3. 리딩 도구/AI 사진 분석: shadcn dashboard, Tailwind Admin
4. 고급 랜딩/프리미엄 상품: Aceternity, Magic UI 일부
5. 커뮤니티/사례 피드: Supabase + shadcn 기반 자체 제작

## 1. 지식 자료실/가이드북형

### Fumadocs

- 링크: https://fumadocs.dev/
- 용도: 룬 가이드북, 자료실, 24룬 해석 사전, 검색 가능한 문서 사이트
- 가져올 점:
  - 좌측 목차
  - 본문 중심 레이아웃
  - 문서 검색
  - MDX 기반 콘텐츠
- runes.co.kr 적용:
  - `/beginner`
  - `/study`
  - `/library`
  - `/runes/[id]`

### Nextra

- 링크: https://nextra.site/docs
- 용도: 블로그+문서형 콘텐츠 사이트
- 가져올 점:
  - 깔끔한 문서 테마
  - 블로그/문서 공존
  - SEO에 강한 정적 콘텐츠
- runes.co.kr 적용:
  - 가이드북 연재
  - 룬별 해석 페이지
  - 유튜브 강의 노트

### Mintlify

- 링크: https://www.mintlify.com/
- 용도: 프리미엄 지식베이스/문서 검색 UX 참고
- 가져올 점:
  - 검색 중심 자료실
  - 사이드바 구조
  - AI 지식베이스 느낌
- runes.co.kr 적용:
  - RAG 자료 도서관
  - PDF/유튜브/오픈자료 색인

## 2. 콘텐츠 카드/블록형

### shadcn/ui

- 링크: https://ui.shadcn.com/
- 용도: 기본 UI 컴포넌트
- 가져올 점:
  - 버튼, 카드, 탭, 다이얼로그, 폼, 테이블
  - 접근성 좋은 컴포넌트
  - Tailwind와 궁합
- runes.co.kr 적용:
  - 룬 카드
  - 스프레드 선택
  - 리딩 결과지
  - 로그인/프로필/관리자

### TWBlocks

- 링크: https://www.shadcn.io/template/tommyjepsen-twblocks
- 용도: 랜딩/콘텐츠 블록 참고
- 가져올 점:
  - 헤더
  - 기능 카드
  - 가격표
  - FAQ
  - 블로그 레이아웃
- runes.co.kr 적용:
  - 첫 화면 바로가기 카드
  - 무료/유료 기능 소개
  - FAQ

## 3. 리딩 도구/대시보드형

### TailAdmin Next.js

- 링크: https://tailwind-admin.com/nextjs
- 용도: 관리자/대시보드/내 기록장 UX
- 가져올 점:
  - 데이터 테이블
  - 대시보드 카드
  - 사이드바
  - 통계/필터
- runes.co.kr 적용:
  - 내 리딩 기록장
  - 관리자 콘텐츠 관리
  - 사용자 사례 관리
  - 키트 활성화 관리

### shadcn dashboard patterns

- 링크: https://ui.shadcn.com/examples/dashboard
- 용도: 사례/기록/AI 분석 결과 화면
- 가져올 점:
  - 리스트+상세 패널
  - 차분한 업무형 UI
  - 데이터 필터
- runes.co.kr 적용:
  - `/my`
  - `/cases`
  - `/admin`

## 4. 고급 랜딩/프리미엄 무드

### Magic UI

- 링크: https://magicui.design/
- 템플릿 소개: https://www.shadcn.io/template/magicuidesign-magicui
- 용도: 적은 양의 고급 인터랙션
- 가져올 점:
  - subtle animation
  - marquee/interactive cards
  - text reveal
- 주의:
  - 룬 사이트에 과하게 쓰면 AI SaaS 느낌이 너무 강해진다.
  - 첫 화면과 AI 사진 분석 CTA 정도에만 제한적으로 사용.

### Aceternity UI

- 링크: https://ui.aceternity.com/components
- 템플릿: https://ui.aceternity.com/website-templates
- 용도: 프리미엄 랜딩/상품 페이지 참고
- 가져올 점:
  - 고급 마이크로 인터랙션
  - AI SaaS 템플릿 구조
  - 프리미엄 상품 소개
- runes.co.kr 적용:
  - AI 사진 분석 소개
  - 프리미엄 플랜
  - 룬스톤 키트 상세페이지

## 5. 사이트 톤 참고

### The Main Tarot

- 링크: https://themaintarot.com/
- 용도: 정보형 점술 커뮤니티 구조 참고
- 가져올 점:
  - 카드 해석 DB
  - 무료 테스트
  - 스프레드
  - 임상/사례
  - 커뮤니티 기반 콘텐츠
- runes.co.kr 적용:
  - 룬 해석 DB
  - 룬 임상/사례
  - 초보 학습 콘텐츠

## 추천 조합

### 첫 버전

```txt
Next.js + shadcn/ui + Tailwind
Fumadocs/Nextra식 문서 구조
Supabase 커뮤니티/기록장
Magic UI 아주 약간
```

### 페이지별 UI 방향

| 페이지 | 참고 UI |
|---|---|
| `/` | TWBlocks + 자체 룬 무드 |
| `/beginner` | Fumadocs/Nextra 문서형 |
| `/runes/[id]` | 문서형 + shadcn tabs/cards |
| `/reading` | shadcn form/card/result |
| `/reading/photo` | dashboard + upload flow |
| `/cases` | shadcn dashboard/list |
| `/library` | Mintlify/Fumadocs |
| `/kit` | Aceternity/Magic UI 일부 |
| `/pricing` | TWBlocks/shadcn pricing |

## runes.co.kr에서 피할 것

- 보라색 그라데이션 AI SaaS 범벅
- 움직임 많은 마법 효과
- 검정+빨강 오컬트/공포톤
- 바이킹 전사/해골/피/불꽃
- 카드만 둥둥 떠 있는 랜딩

## 우리가 만들 무드

```txt
Quiet Rune Archive
조용한 룬 기록소
왕초보가 읽을 수 있는 가이드북
실제 룬스톤을 뽑고 기록하는 도구
자료실과 커뮤니티가 같이 있는 사이트
```
