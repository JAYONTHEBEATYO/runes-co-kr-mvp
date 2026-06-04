# runes.co.kr Next.js 템플릿 후보

조사일: 2026-06-04  
목표: 더메인타로형 룬 정보/커뮤니티 사이트. 모바일 반응형, SEO, 룬 해석 DB, 무료 리딩, 임상/사례 공유, 자료실, 추후 QR 키트/결제 확장.

## 결론

`runes.co.kr`은 **Next.js + TypeScript + Tailwind CSS + shadcn/ui + Supabase** 조합이 가장 현실적이다.

- Next.js: 룬별 SEO 페이지, 자료실, 무료 리딩, 커뮤니티 라우팅에 적합.
- Tailwind/shadcn: 깔끔한 UI를 빠르게 만들기 좋고, 룬 사이트 무드를 커스터마이징하기 쉽다.
- Supabase: 회원, 임상/사례, 댓글, 저장 기록, 관리자 기능에 적합.
- MDX/JSON: 룬 해석 사전, 공부 자료, 스프레드 같은 정적 콘텐츠에 적합.

오픈소스에 “신비롭지만 깔끔한 룬 전용 템플릿”은 거의 없다. 인기 템플릿은 대부분 범용이다. 따라서 구조는 검증된 템플릿에서 가져오고, 디자인 무드는 자체 제작하는 방향이 맞다.

## 1순위 후보: NextBase Starter

- Repo: https://github.com/imbhargav5/nextbase-nextjs-supabase-starter
- License: MIT
- Stars: 약 793
- 최근 push: 2026-06-03 기준 확인
- Stack: Next.js 16, React 19, TypeScript, Supabase, RLS, shadcn/ui, Tailwind CSS v4, TanStack Query, Zod, Playwright/Vitest

### 장점

- 회원/로그인/DB/RLS 구조가 이미 잡혀 있다.
- 커뮤니티 기능을 만들기 좋다.
- Supabase Auth, Postgres, Storage로 게시글/댓글/이미지/프로필 확장이 쉽다.
- 모바일 반응형 UI를 shadcn/Tailwind로 빠르게 만들 수 있다.

### 단점

- 블로그 템플릿보다 구조가 크다.
- 처음 세팅할 때 Supabase 환경변수가 필요하다.

### runes.co.kr 적용

가장 추천한다.  
초기에는 `룬 해석 DB + 무료 리딩 + 임상/사례 게시판`을 만들고, 나중에 `QR 키트`, `PDF 결과지`, `프리미엄 리딩`, `상담사 도구`까지 갈 수 있다.

## 2순위 후보: tailwind-nextjs-starter-blog

- Repo: https://github.com/timlrx/tailwind-nextjs-starter-blog
- License: MIT
- Stars: 약 10.5k
- 최근 push: 2026-02-08 기준 확인
- Stack: Next.js, Tailwind CSS, Contentlayer, Markdown/MDX

### 장점

- SEO 블로그/자료실/룬 해석 사전에 매우 강하다.
- 구조가 가볍고 빠르다.
- 룬별 페이지 24개, 스프레드 글, 공부 자료, 자료실을 빠르게 만들 수 있다.

### 단점

- 회원, 게시판, 댓글, 임상 공유 기능은 직접 붙여야 한다.
- 커뮤니티 사이트로 키울 때 DB 구조를 새로 설계해야 한다.

### runes.co.kr 적용

“자료실 먼저” 전략이면 좋다.  
하지만 우리는 임상/사례 커뮤니티까지 갈 예정이므로 단독 베이스보다는 참고용이 낫다.

## 3순위 후보: ixartz/SaaS-Boilerplate

- Repo: https://github.com/ixartz/SaaS-Boilerplate
- License: MIT
- Stars: 약 7.1k
- 최근 push: 2026-06-01 기준 확인
- Stack: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Auth, roles, i18n, DB, logging, testing

### 장점

- 상용 서비스 보일러플레이트로 기능이 풍부하다.
- 역할/권한, 대시보드, i18n, 테스트 구조가 좋다.
- 나중에 프리미엄/결제/관리자까지 가기 좋다.

### 단점

- 룬 커뮤니티 초기 MVP에는 과하다.
- Clerk 같은 외부 인증 의존성이 있다.

### runes.co.kr 적용

상용 SaaS 기능을 빠르게 넣고 싶으면 후보지만, 커뮤니티/콘텐츠 사이트 MVP에는 NextBase가 더 자연스럽다.

## 4순위 후보: next_discussion_platform

- Repo: https://github.com/mbeps/next_discussion_platform
- License: MIT
- Stars: 약 105
- 최근 릴리즈: 2025-12 기준 확인
- Stack: Next.js App Router, Firebase, Firestore, Storage, Chakra UI

### 장점

- 게시판/커뮤니티 기능이 이미 있다.
- 커뮤니티, 투표, 저장, 댓글, 검색, 반응형, 라이트/다크 모드 구조가 있다.
- 룬 임상/사례 게시판 구조 참고에 좋다.

### 단점

- 별 수가 낮고, Firebase/Chakra 기반이라 우리가 추천하는 Supabase/shadcn 구조와 다르다.
- 그대로 쓰기보다 기능 참고용이 맞다.

### runes.co.kr 적용

임상/사례 공유 UX 참고용. 베이스로 쓰지는 않는 쪽이 낫다.

## 5순위 후보: nextjs-notion-starter-kit

- Repo: https://github.com/transitive-bullshit/nextjs-notion-starter-kit
- License: MIT
- Stars: 약 7k
- Stack: Next.js, Notion CMS, Vercel

### 장점

- Notion으로 글을 쓰고 바로 사이트화하기 쉽다.
- 목차, 검색, 반응형, 다크모드, 예쁜 URL 기능이 있다.

### 단점

- 커뮤니티/임상/댓글/회원 기능과는 거리가 있다.
- Notion 의존성이 생긴다.

### runes.co.kr 적용

운영자가 Notion으로 자료실을 관리하고 싶다면 참고 가능. 메인 베이스로는 비추천.

## UI 블록 후보: shadcnspace

- Repo: https://github.com/shadcnspace/shadcnspace
- License: MIT
- Stars: 약 586
- 용도: shadcn/ui 기반 블록, 컴포넌트, 레이아웃 참고

### runes.co.kr 적용

템플릿 베이스가 아니라 UI 부품 참고용.  
검색, 카드 그리드, 헤더, 대시보드, 리스트, CTA, 폼 컴포넌트를 가져와 룬 무드로 재스킨하면 된다.

## 추천 최종 구조

```txt
Next.js App Router
TypeScript
Tailwind CSS v4
shadcn/ui
Supabase Auth
Supabase Postgres
Supabase Storage
MDX or JSON content files
Vercel deployment
```

## runes.co.kr 페이지 구조

```txt
/
/runes
/runes/fehu
/runes/uruz
/reading/daily
/reading/one-rune
/reading/three-rune
/spreads
/spreads/love
/cases
/cases/new
/cases/rune/fehu
/study
/library
/community
/kit
/admin
```

## DB 테이블 초안

```txt
profiles
runes
rune_meanings
spreads
readings
cases
case_comments
case_votes
bookmarks
resources
kit_activations
```

## 디자인 무드

템플릿 자체는 깔끔하게 가져가고, 룬 분위기는 색/타이포/이미지에서 만든다.

- 배경: 종이색, 아이보리
- 본문: 차콜
- 포인트: 황동색, 이끼색, 청회색
- 이미지: 린넨, 종이, 돌, 목재, 조용한 책상
- 금지: 보라색 우주풍, 검빨 악마풍, 바이킹 전사풍, 해골/피/불꽃, 과한 판타지

## 실행 제안

1. NextBase Starter를 베이스로 새 프로젝트 생성
2. shadcn/ui 테마를 `Quiet Rune Archive`로 커스터마이징
3. 현재 만든 24룬 JSON DB를 콘텐츠 소스로 이식
4. `/runes/[id]` 룬 해석 페이지 생성
5. `/cases` 룬 임상/사례 게시판 생성
6. `/reading/daily`, `/reading/one-rune`, `/reading/three-rune` 무료 리딩 생성
7. 관리자 페이지에서 룬 DB/자료글 관리
