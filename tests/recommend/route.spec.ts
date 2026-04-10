import assert from "node:assert/strict";

import { createRecommendRouteHandlers } from "../../app/api/recommend/route.ts";

async function main() {
  const requests: Array<{ url: string; method: string; body?: string }> = [];
  const handlers = createRecommendRouteHandlers({
    backendBaseUrl: "http://3.34.168.45:3001",
    fetchImpl: async (input, init) => {
      requests.push({
        url: String(input),
        method: init?.method ?? "GET",
        body: typeof init?.body === "string" ? init.body : undefined,
      });

      return new Response(
        JSON.stringify({
          meta: { contractVersion: "2026-04-stage-6" },
          recommendations: [{ id: "jongno-passport-office" }],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    },
  });

  const getResponse = await handlers.GET(
    new Request(
      "http://localhost/api/recommend?purposeId=passport-reissue&originLabel=%EC%84%9C%EC%9A%B8%EC%8B%9C%EC%B2%AD&lat=37.5665&lng=126.978&mode=live",
    ),
  );

  assert.equal(getResponse.status, 200);
  assert.equal(requests[0]?.method, "GET");
  assert.equal(
    requests[0]?.url,
    "http://3.34.168.45:3001/api/recommend?purposeId=passport-reissue&originLabel=%EC%84%9C%EC%9A%B8%EC%8B%9C%EC%B2%AD&lat=37.5665&lng=126.978&mode=live",
  );

  const getBody = await getResponse.json();

  assert.equal(getBody.meta.contractVersion, "2026-04-stage-6");
  assert.equal(getBody.recommendations[0].id, "jongno-passport-office");

  const postResponse = await handlers.POST(
    new Request("http://localhost/api/recommend", {
      method: "POST",
      body: JSON.stringify({
        purposeId: "passport-reissue",
        originLabel: "서울시청",
        origin: {
          lat: 37.5665,
          lng: 126.978,
        },
        mode: "demo",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }),
  );

  assert.equal(postResponse.status, 200);
  assert.equal(requests[1]?.method, "POST");
  assert.equal(requests[1]?.url, "http://3.34.168.45:3001/api/recommend");
  assert.deepEqual(JSON.parse(requests[1]?.body ?? "{}"), {
    purposeId: "passport-reissue",
    originLabel: "서울시청",
    origin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "demo",
  });

  const invalidJsonResponse = await handlers.POST(
    new Request("http://localhost/api/recommend", {
      method: "POST",
      body: "{broken-json",
      headers: {
        "Content-Type": "application/json",
      },
    }),
  );

  assert.equal(invalidJsonResponse.status, 400);
  assert.deepEqual(await invalidJsonResponse.json(), {
    error: "INVALID_JSON",
    details: "JSON 본문을 읽을 수 없습니다.",
    contractVersion: "2026-04-stage-6",
  });

  const invalidRequestResponse = await handlers.GET(
    new Request(
      "http://localhost/api/recommend?purposeId=passport-reissue&originLabel=%EC%84%9C%EC%9A%B8%EC%8B%9C%EC%B2%AD&lng=126.978&mode=live",
    ),
  );

  assert.equal(invalidRequestResponse.status, 400);
  assert.equal((await invalidRequestResponse.json()).error, "INVALID_REQUEST");

  const upstreamErrorHandlers = createRecommendRouteHandlers({
    backendBaseUrl: "http://3.34.168.45:3001",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          error: "NO_RECOMMENDATION",
          details: "선택한 민원 목적을 처리할 수 있는 민원실을 찾지 못했습니다.",
          contractVersion: "2026-04-stage-6",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
  });

  const noRecommendationResponse = await upstreamErrorHandlers.GET(
    new Request(
      "http://localhost/api/recommend?purposeId=passport-reissue&originLabel=%EC%84%9C%EC%9A%B8%EC%8B%9C%EC%B2%AD&lat=37.5665&lng=126.978&mode=live",
    ),
  );

  assert.equal(noRecommendationResponse.status, 404);
  assert.deepEqual(await noRecommendationResponse.json(), {
    error: "NO_RECOMMENDATION",
    details: "선택한 민원 목적을 처리할 수 있는 민원실을 찾지 못했습니다.",
    contractVersion: "2026-04-stage-6",
  });

  const configErrorHandlers = createRecommendRouteHandlers({
    backendBaseUrl: null,
  });

  const configErrorResponse = await configErrorHandlers.GET(
    new Request(
      "http://localhost/api/recommend?purposeId=passport-reissue&originLabel=%EC%84%9C%EC%9A%B8%EC%8B%9C%EC%B2%AD&lat=37.5665&lng=126.978&mode=live",
    ),
  );

  assert.equal(configErrorResponse.status, 503);
  assert.deepEqual(await configErrorResponse.json(), {
    error: "UPSTREAM_CONFIG_ERROR",
    details: "추천 백엔드 주소가 설정되지 않았습니다.",
    contractVersion: "2026-04-stage-6",
  });

  console.log("recommend route spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
