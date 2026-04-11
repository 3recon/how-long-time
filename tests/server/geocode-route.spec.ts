import assert from "node:assert/strict";

import { createGeocodeRouteHandlers } from "../../app/api/geocode/route.ts";

async function main() {
  const handlers = createGeocodeRouteHandlers({
    geocodeAddressImpl: async (originLabel) => {
      assert.equal(originLabel, "잠실역");

      return {
        addressName: "서울 송파구 올림픽로 265",
        coordinates: {
          lat: 37.5133,
          lng: 127.1001,
        },
      };
    },
  });

  const successResponse = await handlers.GET(
    new Request("http://localhost:3000/api/geocode?originLabel=%EC%9E%A0%EC%8B%A4%EC%97%AD"),
  );
  const successBody = await successResponse.json();

  assert.equal(successResponse.status, 200);
  assert.deepEqual(successBody, {
    originLabel: "잠실역",
    resolvedAddress: "서울 송파구 올림픽로 265",
    coordinates: {
      lat: 37.5133,
      lng: 127.1001,
    },
  });

  const invalidResponse = await handlers.GET(
    new Request("http://localhost:3000/api/geocode?originLabel=   "),
  );
  const invalidBody = await invalidResponse.json();

  assert.equal(invalidResponse.status, 400);
  assert.equal(invalidBody.error, "INVALID_ORIGIN_LABEL");

  const upstreamHandlers = createGeocodeRouteHandlers({
    geocodeAddressImpl: async () => {
      throw new Error("kakao down");
    },
  });
  const upstreamResponse = await upstreamHandlers.GET(
    new Request("http://localhost:3000/api/geocode?originLabel=%EC%9E%A0%EC%8B%A4%EC%97%AD"),
  );
  const upstreamBody = await upstreamResponse.json();

  assert.equal(upstreamResponse.status, 502);
  assert.equal(upstreamBody.error, "GEOCODE_UPSTREAM_ERROR");

  console.log("server geocode route spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
