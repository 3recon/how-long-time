import assert from "node:assert/strict";

import { createApp } from "../src/app.js";
import type { RecommendRequest } from "../src/contracts/recommend.js";

async function main() {
  const requests: RecommendRequest[] = [];
  const app = createApp({
    now: () => new Date("2026-04-10T09:00:00.000Z"),
    recommendService: {
      recommend: async (request) => {
        requests.push(request);

        return {
          request,
          meta: {
            contractVersion: "2026-04-stage-7",
            requestedAt: "2026-04-10T09:00:00.000Z",
            mode: request.mode,
            dataSource: request.mode === "demo" ? "demo-sample" : "live-api",
            scenarioId:
              request.mode === "demo"
                ? "demo-seoul-cityhall-passport"
                : null,
            purposeMappingVersion: "2026-04-stage-4",
          },
          summary: {
            totalCandidateCount: 1,
            returnedRecommendationCount: 1,
          },
          recommendations: [
            {
              id: "jongno-passport-office",
              name: "종로구청 여권 민원실",
              address: "서울 종로구 삼봉로 43",
              coordinates: {
                lat: 37.5721,
                lng: 126.9794,
              },
              supportedPurposeIds: ["passport-reissue", "passport-pickup"],
              supportedTaskMatches: [
                {
                  taskName: "여권 신청",
                  ruleType: "keyword",
                },
              ],
              waiting: {
                count: 8,
                estimatedMinutes: 24,
                updatedAt: "2026-04-10T08:55:00.000+09:00",
              },
              travel: {
                minutes: 19,
                distanceKm: 3.2,
              },
              recommendation: {
                rank: 1,
                totalMinutes: 43,
                reason: "대기시간 비중이 커 총 소요시간을 먼저 확인하는 편이 좋습니다.",
              },
            },
          ],
        };
      },
    },
  });

  const server = app.listen(0);

  try {
    await new Promise<void>((resolve) => server.once("listening", resolve));

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Failed to resolve test server port.");
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;

    const getResponse = await fetch(
      `${baseUrl}/api/recommend?purposeId=passport-reissue&originLabel=${encodeURIComponent("서울시청")}&lat=37.5665&lng=126.978&mode=live`,
    );

    assert.equal(getResponse.status, 200);
    assert.equal(requests[0]?.mode, "live");
    assert.equal(requests[0]?.originLabel, "서울시청");
    assert.deepEqual((await getResponse.json()).summary, {
      totalCandidateCount: 1,
      returnedRecommendationCount: 1,
    });

    const postResponse = await fetch(`${baseUrl}/api/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        purposeId: "passport-reissue",
        originLabel: "서울시청",
        origin: {
          lat: 37.5665,
          lng: 126.978,
        },
        mode: "demo",
      }),
    });

    assert.equal(postResponse.status, 200);
    assert.equal(requests[1]?.mode, "demo");
    assert.equal((await postResponse.json()).meta.scenarioId, "demo-seoul-cityhall-passport");

    const defaultModeResponse = await fetch(
      `${baseUrl}/api/recommend?purposeId=passport-reissue&originLabel=${encodeURIComponent("서울시청")}&lat=37.5665&lng=126.978`,
    );

    assert.equal(defaultModeResponse.status, 200);
    assert.equal(requests[2]?.mode, "demo");

    const legacyPurposeResponse = await fetch(
      `${baseUrl}/api/recommend?purpose=${encodeURIComponent("여권 재발급")}&originLabel=${encodeURIComponent("서울시청")}&lat=37.5665&lng=126.978&mode=demo`,
    );

    assert.equal(legacyPurposeResponse.status, 400);
    assert.deepEqual(await legacyPurposeResponse.json(), {
      error: "INVALID_REQUEST",
      details:
        'Invalid option: expected one of "passport-reissue"|"passport-pickup"|"certificate-issuance"|"family-relation-certificate"|"resident-registration"',
      contractVersion: "2026-04-stage-7",
    });

    const invalidJsonResponse = await fetch(`${baseUrl}/api/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{broken-json",
    });

    assert.equal(invalidJsonResponse.status, 400);
    assert.deepEqual(await invalidJsonResponse.json(), {
      error: "INVALID_JSON",
      details: "JSON 본문을 읽을 수 없습니다.",
      contractVersion: "2026-04-stage-7",
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  console.log("recommend route spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
