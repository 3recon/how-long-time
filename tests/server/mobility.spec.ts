import assert from "node:assert/strict";

import {
  KakaoLocalApiError,
  buildKakaoAddressSearchUrl,
  geocodeAddress,
  parseKakaoAddressSearchResponse,
} from "../../lib/server/kakao-local.ts";
import {
  MobilityApiError,
  createMobilityService,
} from "../../lib/server/mobility.ts";
import {
  ODsayApiError,
  buildODsayPublicTransitUrl,
  getPublicTransitTravelTime,
  parseODsaySearchResponse,
} from "../../lib/server/odsay.ts";

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

  const geocoded = await geocodeAddress("서울시청", {
    apiKey: "kakao-key",
    fetchImpl: async (input, init) => {
      assert.equal(
        String(input),
        buildKakaoAddressSearchUrl({
          apiKey: "kakao-key",
          query: "서울시청",
        }).toString(),
      );
      assert.equal(init?.method, "GET");
      assert.equal(
        (init?.headers as Record<string, string>).Authorization,
        "KakaoAK kakao-key",
      );

      return new Response(JSON.stringify(kakaoPayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
  });

  assert.deepEqual(geocoded, {
    addressName: "서울 중구 세종대로 110",
    coordinates: {
      lat: 37.5666103,
      lng: 126.9783882,
    },
  });

  const odsayPayload = {
    result: {
      path: [
        {
          info: {
            totalTime: 42,
            totalDistance: 12345,
            payment: 1450,
            busTransitCount: 1,
            subwayTransitCount: 1,
          },
        },
        {
          info: {
            totalTime: 55,
            totalDistance: 13000,
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

  const travelEstimate = await getPublicTransitTravelTime({
    origin: { lat: 37.5665, lng: 126.978 },
    destination: { lat: 37.5796, lng: 126.977 },
    apiKey: "odsay-key",
    fetchImpl: async () =>
      new Response(JSON.stringify(odsayPayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
  });

  assert.deepEqual(travelEstimate, {
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
  assert.equal(timeoutResult.fallback.travel.minutes, 60);
  assert.match(timeoutResult.fallback.message, /timeout/i);

  const successService = createMobilityService({
    kakaoApiKey: "kakao-key",
    odsayApiKey: "odsay-key",
    timeoutMs: 100,
    fetchImpl: async (input) => {
      if (String(input).includes("kakao")) {
        return new Response(JSON.stringify(kakaoPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      return new Response(JSON.stringify(odsayPayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
  });

  const successResult = await successService.lookupTravelTime({
    originAddress: "서울시청",
    destination: {
      label: "종로구청",
      coordinates: {
        lat: 37.5730506,
        lng: 126.9791892,
      },
    },
  });

  assert.deepEqual(successResult, {
    ok: true,
    origin: {
      label: "서울 중구 세종대로 110",
      coordinates: {
        lat: 37.5666103,
        lng: 126.9783882,
      },
    },
    destination: {
      label: "종로구청",
      coordinates: {
        lat: 37.5730506,
        lng: 126.9791892,
      },
    },
    travel: {
      minutes: 42,
      distanceKm: 12.35,
    },
  });

  const fallbackService = createMobilityService({
    kakaoApiKey: "kakao-key",
    odsayApiKey: "odsay-key",
    fetchImpl: async (input) => {
      if (String(input).includes("kakao")) {
        return new Response(JSON.stringify(kakaoPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      throw new Error("network down");
    },
  });

  const fallbackResult = await fallbackService.lookupTravelTime({
    originAddress: "서울시청",
    destination: {
      label: "종로구청",
      coordinates: {
        lat: 37.5730506,
        lng: 126.9791892,
      },
    },
  });

  assert.equal(fallbackResult.ok, false);

  if (fallbackResult.ok) {
    throw new Error("fallbackResult should not be ok");
  }

  assert.equal(fallbackResult.fallback.code, "MOBILITY_LOOKUP_FAILED");
  assert.equal(fallbackResult.fallback.travel.minutes, 60);
  assert.match(fallbackResult.fallback.message, /대중교통|mobility/i);

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

  console.log("mobility spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
