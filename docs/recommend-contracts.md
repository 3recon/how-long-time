# 추천 데이터 계약 선설계

## 목적
- 2단계 브랜치 `feat/recommend-contracts`에서 추천 API, demo 데이터, 민원 목적 매핑이 같은 계약을 공유하도록 기준을 고정한다.
- 이후 `feat/public-data-api`, `feat/task-mapping`, `feat/recommend-api`, `feat/demo-mode`가 이 문서를 기준으로 이어지게 한다.

## 핵심 결정
- 요청의 민원 목적은 자유 문자열이 아니라 `purposeId`로 받는다.
- 응답은 `request`, `meta`, `summary`, `recommendations` 네 덩어리로 나눈다.
- `live`와 `demo`는 같은 응답 구조를 쓰고 `meta.dataSource`, `meta.scenarioId`로만 차이를 표현한다.
- 민원 목적 UI 목록과 `taskNm` 필터링 기준은 별도 데이터 파일에서 함께 관리한다.

## 요청 계약
- 엔드포인트: `GET /api/recommend`, `POST /api/recommend`
- 필수 입력값
  - `purposeId`
  - `originLabel`
  - `origin.lat`
  - `origin.lng`
- 선택 입력값
  - `mode`
- 기본값
  - `mode` 미입력 시 `demo`

## 응답 계약
- `request`
  - `purposeId`
  - `originLabel`
  - `origin.lat`
  - `origin.lng`
  - `mode`
- `meta`
  - `contractVersion`
  - `requestedAt`
  - `mode`
  - `dataSource`
  - `scenarioId`
  - `purposeMappingVersion`
- `summary`
  - `totalCandidateCount`
  - `returnedRecommendationCount`
- `recommendations`
  - `id`
  - `name`
  - `address`
  - `coordinates`
  - `supportedPurposeIds`
  - `supportedTaskMatches`
  - `waiting`
  - `travel`
  - `recommendation`

## 오류 응답 계약
- 최상위 구조는 `error`, `details`, `contractVersion`로 고정한다.
- `contractVersion`은 성공 응답의 `meta.contractVersion`과 같은 값을 쓴다.
- 검증 실패, upstream 오류, 추천 결과 없음 모두 같은 오류 스키마를 쓴다.

## 민원 목적 카탈로그 원칙
- 프론트 선택지와 백엔드 필터의 기준 키는 `purposeId` 하나로 통일한다.
- 라벨과 설명은 카탈로그에서만 관리한다.
- demo 시나리오 선택도 카탈로그의 `demoScenarioId`를 기준으로 연결한다.

## `taskNm` 매핑 원칙
- 포함 규칙과 제외 규칙을 분리한다.
- 규칙 단위는 `exact`, `keyword`, `alias` 셋 중 하나로 둔다.
- 초기 MVP는 키워드 중심으로 시작하고, 공공데이터 실제 응답을 확보한 뒤 `feat/task-mapping`에서 정밀화한다.
- 매핑 실패 메시지는 목적별로 고정해 사용자 안내와 로그 분석에 같이 쓴다.

## demo 데이터 원칙
- demo JSON도 실제 API 응답과 동일한 최상위 구조를 유지한다.
- demo 전용 차이는 `meta.dataSource = "demo-sample"`와 `meta.scenarioId`로만 표현한다.
- 발표 시나리오가 늘어나면 파일을 추가하되 스키마는 유지한다.
