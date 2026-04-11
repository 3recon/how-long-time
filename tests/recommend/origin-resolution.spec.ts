import assert from "node:assert/strict";

import { resolveRecommendRequest } from "../../lib/recommend/form.ts";

async function main() {
  let demoGeocodeCalled = false;
  const demoPresetRequest = await resolveRecommendRequest({
    originLabel: "잠실역",
    purposeId: "passport-reissue",
    coordinates: {
      lat: 37.5665,
      lng: 126.978,
    },
    fallbackOrigin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "demo",
    preferCurrentCoordinates: false,
    geocodeOrigin: async () => {
      demoGeocodeCalled = true;
      throw new Error("demo preset should bypass geocode");
    },
  });

  assert.equal(demoGeocodeCalled, false);
  assert.deepEqual(demoPresetRequest, {
    purposeId: "passport-reissue",
    originLabel: "잠실역",
    origin: {
      lat: 37.51335,
      lng: 127.10011,
    },
    mode: "demo",
  });

  const geocodedRequest = await resolveRecommendRequest({
    originLabel: "서울 송파구 올림픽로 265",
    purposeId: "passport-reissue",
    coordinates: {
      lat: 37.5665,
      lng: 126.978,
    },
    fallbackOrigin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "demo",
    preferCurrentCoordinates: false,
    geocodeOrigin: async (originLabel) => {
      assert.equal(originLabel, "서울 송파구 올림픽로 265");

      return {
        originLabel: "서울 송파구 올림픽로 265",
        coordinates: {
          lat: 37.5133,
          lng: 127.1001,
        },
      };
    },
  });

  assert.deepEqual(geocodedRequest, {
    purposeId: "passport-reissue",
    originLabel: "서울 송파구 올림픽로 265",
    origin: {
      lat: 37.5133,
      lng: 127.1001,
    },
    mode: "demo",
  });

  const normalizedDemoPresetRequest = await resolveRecommendRequest({
    originLabel: "  건대입구역  ",
    purposeId: "resident-registration",
    coordinates: {
      lat: 37.5665,
      lng: 126.978,
    },
    fallbackOrigin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "demo",
    preferCurrentCoordinates: false,
    geocodeOrigin: async () => {
      throw new Error("normalized demo preset should bypass geocode");
    },
  });

  assert.deepEqual(normalizedDemoPresetRequest, {
    purposeId: "resident-registration",
    originLabel: "건대입구역",
    origin: {
      lat: 37.539996,
      lng: 127.070627,
    },
    mode: "demo",
  });

  let geocodeCalled = false;
  const currentLocationRequest = await resolveRecommendRequest({
    originLabel: "현재 위치",
    purposeId: "resident-registration",
    coordinates: {
      lat: 37.4981,
      lng: 127.0276,
    },
    fallbackOrigin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "live",
    preferCurrentCoordinates: true,
    geocodeOrigin: async () => {
      geocodeCalled = true;
      throw new Error("should not geocode current location");
    },
  });

  assert.equal(geocodeCalled, false);
  assert.deepEqual(currentLocationRequest, {
    purposeId: "resident-registration",
    originLabel: "현재 위치",
    origin: {
      lat: 37.4981,
      lng: 127.0276,
    },
    mode: "live",
  });

  await assert.rejects(
    () =>
      resolveRecommendRequest({
        originLabel: "없는 주소",
        purposeId: "certificate-issuance",
        coordinates: {
          lat: 37.5665,
          lng: 126.978,
        },
        fallbackOrigin: {
          lat: 37.5665,
          lng: 126.978,
        },
        mode: "demo",
        preferCurrentCoordinates: false,
        geocodeOrigin: async () => {
          throw new Error("geocode failed");
        },
      }),
    /geocode failed/,
  );

  console.log("recommend origin resolution spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
