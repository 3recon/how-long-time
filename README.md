# 민원나우

민원 목적과 출발지를 입력하면 대기 인원과 이동시간을 함께 고려해
방문할 민원실을 추천하는 서비스입니다.

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- Prettier

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 준비

루트의 [.env.example](C:/dev/how_long_time/.env.example)를 기준으로
`.env.local`을 준비합니다.

로컬에서 Lightsail 백엔드를 직접 호출하려면 아래 값을 사용합니다.

```env
NEXT_PUBLIC_API_BASE_URL=http://3.34.168.45:3001
SERVER_BASE_URL=http://3.34.168.45:3001
```

자세한 설명은 [.env.example.md](C:/dev/how_long_time/.env.example.md)를
참고하면 됩니다.

mobility API 연동을 확인하려면 `KAKAO_REST_API_KEY`,
`ODSAY_API_KEY`, `REQUEST_TIMEOUT_MS`도 함께 설정해야 합니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

## 자주 쓰는 명령어

```bash
npm run dev
npm run lint
npm run build
npm run format
npm run format:check
```

## 현재 포함된 범위

- Next.js App Router + TypeScript + Tailwind CSS 초기 세팅
- ESLint + Prettier 기본 설정
- 추천 API 요청/응답 타입 초안
- demo 모드 샘플 데이터 초안
- 공공데이터 민원실 실시간 정보 API 파서/변환 모듈
- 공공데이터 API 테스트용 샘플 응답
- 민원나우용 초기 랜딩 화면

## 폴더 구조

```text
app/                라우팅과 페이지 엔트리
components/         재사용 UI 컴포넌트
components/ui/      기초 UI 조각
components/home/    메인 화면 전용 UI
data/demo/          심사용 고정 샘플 데이터
data/mappings/      민원 목적 매핑 데이터 예정 위치
lib/                공용 유틸과 환경설정
lib/server/         서버 전용 API 연동 모듈 예정 위치
types/              추천 API와 도메인 타입
public/images/      정적 이미지 자산
```

## 실행 확인 기준

1. `npm run lint`가 통과해야 합니다.
2. `npm run build`가 통과해야 합니다.
3. 첫 화면에서 민원나우 부트스트랩 안내가 보여야 합니다.

## API 골격

현재는 이후 단계 연결을 위한 `/api/recommend` 골격이 포함되어 있습니다.

### GET 예시

```text
/api/recommend?purpose=여권%20재발급&originLabel=서울시청&lat=37.5665&lng=126.9780&mode=demo
```

### POST 예시

```json
{
  "purpose": "여권 재발급",
  "originLabel": "서울시청",
  "origin": {
    "lat": 37.5665,
    "lng": 126.978
  },
  "mode": "demo"
}
```

지금은 검증 후 demo 샘플 응답을 반환하고, 이후 단계에서 live 연동과
추천 로직을 이 라우트에 연결할 예정입니다.

## 다음 작업

- 민원 목적과 `taskNm` 매핑 규칙 구체화
- 공공데이터 live 데이터와 추천 로직 연결

## 공공데이터 API 메모

- 엔드포인트: `https://apis.data.go.kr/B551982/cso_v2/cso_realtime_v2`
- 필수 서버 키: `PUBLIC_DATA_API_KEY`
- 테스트용 샘플: [data/public-data/cso-realtime-sample.json](C:/dev/how_long_time/data/public-data/cso-realtime-sample.json)
- 서버 모듈: [lib/server/public-data.ts](C:/dev/how_long_time/lib/server/public-data.ts)
