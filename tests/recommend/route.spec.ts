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
          meta: { contractVersion: "2026-04-stage-7" },
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
      "http://localhost/api/recommend?purposeId=passport-reissue&originLabel=Seoul&lat=37.5665&lng=126.978&mode=live",
    ),
  );

  assert.equal(getResponse.status, 200);
  assert.equal(requests[0]?.method, "GET");
  assert.equal(
    requests[0]?.url,
    "http://3.34.168.45:3001/api/recommend?purposeId=passport-reissue&originLabel=Seoul&lat=37.5665&lng=126.978&mode=live",
  );

  const getBody = await getResponse.json();

  assert.equal(getBody.meta.contractVersion, "2026-04-stage-7");
  assert.equal(getBody.recommendations[0].id, "jongno-passport-office");

  const localDemoHandlers = createRecommendRouteHandlers({
    backendBaseUrl: "http://3.34.168.45:3001",
    fetchImpl: async () => {
      throw new Error("demo mode should not call upstream backend");
    },
  });

  const localDemoResponse = await localDemoHandlers.GET(
    new Request(
      "http://localhost/api/recommend?purposeId=passport-pickup&originLabel=Seoul&lat=37.5665&lng=126.978&mode=demo",
    ),
  );

  assert.equal(localDemoResponse.status, 200);
  const localDemoBody = await localDemoResponse.json();
  assert.equal(localDemoBody.request.mode, "demo");
  assert.equal(localDemoBody.request.purposeId, "passport-pickup");
  assert.equal(localDemoBody.meta.dataSource, "demo-sample");
  assert.ok(localDemoBody.recommendations.length > 0);

  const postDemoResponse = await handlers.POST(
    new Request("http://localhost/api/recommend", {
      method: "POST",
      body: JSON.stringify({
        purposeId: "passport-reissue",
        originLabel: "Seoul",
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

  assert.equal(postDemoResponse.status, 200);
  assert.equal((await postDemoResponse.json()).request.mode, "demo");
  assert.equal(requests.length, 1);

  const postLiveResponse = await handlers.POST(
    new Request("http://localhost/api/recommend", {
      method: "POST",
      body: JSON.stringify({
        purposeId: "passport-reissue",
        originLabel: "Seoul",
        origin: {
          lat: 37.5665,
          lng: 126.978,
        },
        mode: "live",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }),
  );

  assert.equal(postLiveResponse.status, 200);
  assert.equal(requests[1]?.method, "POST");
  assert.equal(requests[1]?.url, "http://3.34.168.45:3001/api/recommend");
  assert.deepEqual(JSON.parse(requests[1]?.body ?? "{}"), {
    purposeId: "passport-reissue",
    originLabel: "Seoul",
    origin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "live",
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
  assert.equal((await invalidJsonResponse.json()).error, "INVALID_JSON");

  const invalidRequestResponse = await handlers.GET(
    new Request(
      "http://localhost/api/recommend?purposeId=passport-reissue&originLabel=Seoul&lng=126.978&mode=live",
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
          details: "No offices support the selected purpose.",
          contractVersion: "2026-04-stage-7",
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
      "http://localhost/api/recommend?purposeId=passport-reissue&originLabel=Seoul&lat=37.5665&lng=126.978&mode=live",
    ),
  );

  assert.equal(noRecommendationResponse.status, 404);
  assert.deepEqual(await noRecommendationResponse.json(), {
    error: "NO_RECOMMENDATION",
    details: "No offices support the selected purpose.",
    contractVersion: "2026-04-stage-7",
  });

  const configErrorHandlers = createRecommendRouteHandlers({
    backendBaseUrl: null,
  });

  const configErrorResponse = await configErrorHandlers.GET(
    new Request(
      "http://localhost/api/recommend?purposeId=passport-reissue&originLabel=Seoul&lat=37.5665&lng=126.978&mode=live",
    ),
  );

  assert.equal(configErrorResponse.status, 503);
  assert.equal((await configErrorResponse.json()).error, "UPSTREAM_CONFIG_ERROR");

  console.log("recommend route spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
