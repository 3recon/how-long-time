# Demo 시나리오 가이드

## 목적
- `mode = "demo"`일 때 어떤 입력이 어떤 시나리오로 연결되는지 정리한다.
- 심사용 재현성을 위해 현재 준비된 demo 입력값과 대표 결과를 문서화한다.
- exact match가 없을 때 어떤 기준으로 fallback 되는지 설명한다.

## 적용 범위
- 프론트 샘플 데이터: [data/demo/recommendation-sample.json](/C:/dev/how_long_time/data/demo/recommendation-sample.json)
- 백엔드 샘플 데이터: [lightsail-backend/src/data/demo/recommendation-sample.json](/C:/dev/how_long_time/lightsail-backend/src/data/demo/recommendation-sample.json)
- 선택 로직: [lightsail-backend/src/recommend/demo.ts](/C:/dev/how_long_time/lightsail-backend/src/recommend/demo.ts)

## 기본 요청 형식

```json
{
  "purposeId": "passport-reissue",
  "originLabel": "서울시청",
  "origin": {
    "lat": 37.5665,
    "lng": 126.978
  },
  "mode": "demo"
}
```

## 현재 준비된 exact 입력값

| purposeId | originLabel | 좌표(lat, lng) | scenarioId |
| --- | --- | --- | --- |
| `passport-reissue` | `서울시청` | `37.5665, 126.9780` | `demo-seoul-cityhall-passport` |
| `passport-reissue` | `잠실역` | `37.5133, 127.1001` | `demo-seoul-jamsil-passport` |
| `passport-pickup` | `성수역` | `37.5446, 127.0557` | `demo-seoul-seongsu-passport-pickup` |
| `certificate-issuance` | `홍대입구역` | `37.5573, 126.9245` | `demo-seoul-hongdae-certificate` |
| `family-relation-certificate` | `강남역` | `37.4979, 127.0276` | `demo-seoul-gangnam-family` |
| `resident-registration` | `건대입구역` | `37.5404, 127.0693` | `demo-seoul-konkuk-resident` |

## 시나리오별 대표 결과

| scenarioId | 목적 | 출발지 | 추천 후보 수 | 1순위 민원실 | 총 소요시간 | 대기 | 이동 |
| --- | --- | --- | ---: | --- | ---: | ---: | ---: |
| `demo-seoul-cityhall-passport` | `passport-reissue` | `서울시청` | 2 | `종로구청 여권 민원실` | 40분 | 22분 | 18분 |
| `demo-seoul-jamsil-passport` | `passport-reissue` | `잠실역` | 2 | `중구청 민원여권과` | 43분 | 15분 | 28분 |
| `demo-seoul-seongsu-passport-pickup` | `passport-pickup` | `성수역` | 3 | `성동구청 민원여권과` | 18분 | 6분 | 12분 |
| `demo-seoul-hongdae-certificate` | `certificate-issuance` | `홍대입구역` | 1 | `중구청 민원여권과` | 69분 | 42분 | 27분 |
| `demo-seoul-gangnam-family` | `family-relation-certificate` | `강남역` | 1 | `성동구청 민원여권과` | 32분 | 3분 | 29분 |
| `demo-seoul-konkuk-resident` | `resident-registration` | `건대입구역` | 1 | `성동구청 민원여권과` | 42분 | 33분 | 9분 |

## 선택 기준
`demo` 모드에서는 준비된 6개 시나리오 중 하나를 고른다.

1. `purposeId` exact match를 가장 먼저 본다.
2. `originLabel` 정규화 exact match를 본다.
3. `originLabel` 부분 match를 본다.
4. 그래도 안 갈리면 입력 좌표와 시나리오 좌표의 거리가 가장 가까운 것을 고른다.
5. 끝까지 같으면 JSON에 들어 있는 데이터 순서를 tie-breaker로 사용한다.

정규화 기준:
- 공백 제거
- 소문자 변환

이 기준 덕분에 같은 입력은 항상 같은 demo 결과를 반환한다.

## fallback 동작 예시
- `purposeId = "passport-reissue"`이고 `originLabel = "잠실새내"`이면
  `잠실역` 시나리오와 라벨 부분 match가 걸려 `demo-seoul-jamsil-passport`를 선택한다.
- `purposeId`는 맞지만 `originLabel`이 exact match가 아니면 좌표가 더 가까운 시나리오가 선택될 수 있다.
- exact 입력값에 없는 조합이라도 항상 6개 중 하나로 수렴한다.

## 입력 가능 값 해석
- `purposeId`는 추천 요청 계약에 정의된 값만 사용한다.
- `originLabel`은 자유 입력 문자열이지만, demo에서는 위 표의 출발지명에 가까울수록 의도한 시나리오를 고르기 쉽다.
- `origin.lat`, `origin.lng`는 fallback 시나리오 선택에 실제로 사용된다.
- `mode`가 `demo`가 아니면 이 문서의 시나리오 표는 적용되지 않는다.

## 운영 메모
- root와 backend JSON은 같은 내용을 유지해야 한다.
- 시나리오를 추가하거나 수정할 때는 두 JSON과 두 TS export 파일을 함께 갱신한다.
- 계약 구조는 [docs/recommend-contracts.md](/C:/dev/how_long_time/docs/recommend-contracts.md)를 기준으로 유지한다.
