import assert from "node:assert/strict";

import {
  KakaoLocalApiError,
  buildKakaoAddressSearchUrl,
  geocodeAddress,
  parseKakaoAddressSearchResponse,
} from "../src/server/kakao-local.js";
import {
  MobilityApiError,
  createMobilityService,
} from "../src/server/mobility.js";
import {
  ODsayApiError,
  buildODsayPublicTransitUrl,
  getPublicTransitTravelTime,
  parseODsaySearchResponse,
} from "../src/server/odsay.js";

async function main() {
  const kakaoPayload = {
    documents: [
      {
        address_name: "서울 중구 세종대로 110",
        x: "126.9783882",
        y: "37.5666103",
      },
    ],
    meta: {
      total_count: 1,
    },
  };

  assert.equal(
    buildKakaoAddressSearchUrl({
      apiKey: "kakao-key",
      query: "서울시청",
    }).toString(),
    "https://dapi.kakao.com/v2/local/search/address.json?query=%EC%84%9C%EC%9A%B8%EC%8B%9C%EC%B2%AD&size=1",
  );

  assert.deepEqual(parseKakaoAddressSearchResponse(kakaoPayload), {
    addressName: "서울 중구 세종대로 110",
    coordinates: {
      lat: 37.5666103,
      lng: 126.9783882,
    },
  });

  await assert.rejects(
    () => geocodeAddress("   ", { apiKey: "kakao-key" }),
    (error: unknown) =>
      error instanceof KakaoLocalApiError &&
      error.code === "KAKAO_LOCAL_INVALID_QUERY",
  );

  const odsayPayload = {
    result: {
      path: [
        {
          info: {
            totalTime: 42,
            totalDistance: 12345,
          },
        },
      ],
    },
  };

  assert.equal(
    buildODsayPublicTransitUrl({
      apiKey: "odsay-key",
      origin: { lat: 37.5665, lng: 126.978 },
      destination: { lat: 37.5796, lng: 126.977 },
    }).toString(),
    "https://api.odsay.com/v1/api/searchPubTransPathT?SX=126.978&SY=37.5665&EX=126.977&EY=37.5796&apiKey=odsay-key",
  );

  assert.deepEqual(parseODsaySearchResponse(odsayPayload), {
    minutes: 42,
    distanceKm: 12.35,
  });

  const timeoutService = createMobilityService({
    kakaoApiKey: "kakao-key",
    odsayApiKey: "odsay-key",
    timeoutMs: 5,
    fetchImpl: async (_input, init) => {
      await new Promise((resolve) => setTimeout(resolve, 20));

      if (init?.signal instanceof AbortSignal && init.signal.aborted) {
        throw new DOMException("The operation was aborted.", "AbortError");
      }

      return new Response(JSON.stringify({ documents: [] }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
  });

  const timeoutResult = await timeoutService.lookupTravelTime({
    originAddress: "서울시청",
    destination: {
      label: "종로구청",
      coordinates: {
        lat: 37.5730506,
        lng: 126.9791892,
      },
    },
  });

  assert.equal(timeoutResult.ok, false);

  if (timeoutResult.ok) {
    throw new Error("timeoutResult should be a fallback result");
  }

  assert.equal(timeoutResult.fallback.code, "MOBILITY_TIMEOUT");

  await assert.rejects(
    () =>
      createMobilityService({
        kakaoApiKey: "kakao-key",
        odsayApiKey: "odsay-key",
      }).resolveOrigin("  "),
    (error: unknown) =>
      error instanceof MobilityApiError &&
      error.code === "MOBILITY_INVALID_ORIGIN",
  );

  await assert.rejects(
    () =>
      getPublicTransitTravelTime({
        origin: { lat: 37.5665, lng: 126.978 },
        destination: { lat: 37.5796, lng: 126.977 },
        apiKey: "odsay-key",
        fetchImpl: async () =>
          new Response(JSON.stringify({ error: { msg: "bad request" } }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }),
      }),
    (error: unknown) =>
      error instanceof ODsayApiError &&
      error.code === "ODSAY_API_ERROR",
  );

  console.log("mobility spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
