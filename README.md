# Sweet Cafe Story

`Expo + React Native + TypeScript`로 구현한 세로형 캐주얼 퍼즐 게임입니다.  
트리플 매치 퍼즐, 60레벨 진행, 3개 챕터 카페 복구, 데일리 챌린지, 출석, 일일/주간 미션, 부스터, 로컬 저장, Firebase 익명 로그인/클라우드 동기화 구조를 포함합니다.

## 실행 방법

```bash
npm install
npm start
```

- Android: `npm run android`
- iOS: `npm run ios`
- 타입 검사: `npm run typecheck`
- 웹 정적 빌드: `npx expo export --platform web`

## 프로젝트 구조

```text
.
├─ App.tsx
├─ app.json
├─ package.json
├─ src
│  ├─ data
│  │  ├─ cafe.ts
│  │  ├─ items.ts
│  │  ├─ levels.ts
│  │  └─ strings.ts
│  ├─ game
│  │  └─ engine.ts
│  ├─ screens
│  │  └─ RootView.tsx
│  ├─ services
│  │  ├─ feedback.ts
│  │  ├─ firebase.ts
│  │  └─ storage.ts
│  ├─ store
│  │  └─ gameStore.ts
│  ├─ theme
│  │  └─ index.ts
│  ├─ types
│  │  └─ game.ts
│  └─ utils
│     ├─ date.ts
│     └─ rewards.ts
└─ .env.example
```

## 핵심 시스템

### 1. 퍼즐 코어

- 보이는 타일만 선택 가능한 스택형 트리플 매치 퍼즐
- 하단 7칸 트레이, 같은 아이템 3개 자동 제거
- 부스터 4종: `Undo`, `Shuffle`, `Extra Slot`, `Hint`
- 장애물 4종:
  - 덮개 역할: 위 레이어에 가려진 타일
  - 잠금: 같은 아이템 1회 매치 후 선택 가능
  - 얼음: 2회 터치해야 제거
  - 박스: 1회 열고 다음 터치에 수집

### 2. 메타 진행

- 총 60레벨, 챕터 3개, 챕터당 20레벨
- 챕터 복구 포인트 15개
- 별을 사용해 카운터, 메뉴판, 조명, 테라스 등 복구
- 각 복구 포인트마다 2개 스타일 선택지 제공
- 챕터 완료 화면과 60레벨 완료 엔딩 제공

### 3. 반복 동기

- 출석 보상
- 데일리 챌린지
- 일일 미션 3개
- 주간 미션 3개
- 첫 클리어 보너스
- 콤보 점수 보너스

### 4. 저장

- `zustand persist + AsyncStorage`로 진행 저장
- 저장 항목:
  - 닉네임
  - 현재 레벨/해금 상태
  - 별/코인/부스터
  - 레벨별 최고 점수와 별
  - 카페 복구 선택
  - 출석/데일리/주간 미션
  - 설정

### 5. Firebase 연동 구조

- `src/services/firebase.ts`에 익명 로그인 및 Firestore 저장 구현
- 설정값이 비어 있으면 자동으로 로컬 전용 모드로 동작
- 연결 가능 항목:
  - 클라우드 세이브
  - 데일리 챌린지 리더보드

## 환경변수

`.env.example`

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

## Firebase 연결 방법

1. Firebase 콘솔에서 프로젝트 생성
2. Authentication에서 Anonymous 로그인 활성화
3. Firestore 데이터베이스 생성
4. `.env`에 위 키 입력
5. `npm start` 재실행

권장 컬렉션 구조:

- `saves/{uid}`
- `leaderboards/{dateKey}/entries/{uid}`

## GitHub Pages 배포

- 워크플로 파일: [.github/workflows/deploy-pages.yml](/home/user/puzzles/.github/workflows/deploy-pages.yml)
- GitHub Pages URL: `https://hansaejo5-blip.github.io/puzzle/`
- `main` 브랜치에 푸시되면 GitHub Actions가 `dist`를 생성해 자동 배포합니다.
- 저장소 Settings > Pages 에서 Source가 `GitHub Actions`인지 확인하면 됩니다.

## 화면 흐름

1. Splash
2. Intro Story
3. Nickname
4. Tutorial 1~3 레벨
5. Home
6. Level Map
7. Gameplay
8. Victory / Fail
9. Cafe Restore
10. Chapter Complete
11. Ending

## QA 체크리스트 결과

- 앱 부팅 후 스플래시에서 다음 화면으로 이동: 완료
- 첫 실행 시 스토리와 닉네임 입력 흐름: 완료
- 레벨 1~60 데이터 구성: 완료
- 퍼즐 선택, 트레이, 3매치, 승리/패배 판정: 완료
- 부스터 4종 동작: 완료
- 카페 복구 선택 및 저장: 완료
- 출석/데일리/주간 미션: 완료
- 데일리 챌린지 날짜 키 처리(KST): 완료
- 엔딩 화면 진입: 완료
- 타입 검사: 완료 (`npm run typecheck`)

## 현재 구현 범위

- 완전한 로컬 플레이 루프
- 실데이터 기반 60레벨 진행
- 실제 동작하는 카페 복구 메타
- Firebase 연결 가능 구조

## 남은 개선점

- 실제 배경음/효과음 리소스 추가
- Firestore 랭킹 조회 UI 확장
- 광고 SDK 연결
- 레벨별 연출 세분화와 장애물 패턴 튜닝

## 참고

기존 `index.html`, `main.js`, `style.css`는 초기 템플릿 흔적으로 남아 있으며, 실제 앱 엔트리는 `App.tsx`입니다.
