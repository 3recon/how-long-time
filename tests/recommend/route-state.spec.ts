import assert from "node:assert/strict";

import {
  buildRecommendResultsHref,
  parseRecommendResultsSearchParams,
} from "../../lib/recommend/route-state.ts";

async function main() {
  assert.equal(
    buildRecommendResultsHref({
      purposeId: "passport-reissue",
      originLabel: "서울시청",
      origin: {
        lat: 37.5665,
        lng: 126.978,
      },
      mode: "demo",
    }),
    "/results?purposeId=passport-reissue&originLabel=%EC%84%9C%EC%9A%B8%EC%8B%9C%EC%B2%AD&lat=37.5665&lng=126.978&mode=demo",
  );

  const parsedFromSearchParams = parseRecommendResultsSearchParams(
    new URLSearchParams({
      purposeId: "resident-registration",
      originLabel: "강남구청",
      lat: "37.5172",
      lng: "127.0473",
      mode: "live",
    }),
  );

  assert.deepEqual(parsedFromSearchParams, {
    ok: true,
    value: {
      purposeId: "resident-registration",
      originLabel: "강남구청",
      origin: {
        lat: 37.5172,
        lng: 127.0473,
      },
      mode: "live",
    },
  });

  const parsedFromObject = parseRecommendResultsSearchParams({
    purposeId: ["passport-pickup"],
    originLabel: "종로구청",
    lat: "37.5731",
    lng: "126.9792",
  });

  assert.deepEqual(parsedFromObject, {
    ok: true,
    value: {
      purposeId: "passport-pickup",
      originLabel: "종로구청",
      origin: {
        lat: 37.5731,
        lng: 126.9792,
      },
      mode: "demo",
    },
  });

  const invalidParsed = parseRecommendResultsSearchParams({
    purposeId: "passport-pickup",
    originLabel: "종로구청",
    lat: "not-a-number",
    lng: "126.9792",
    mode: "demo",
  });

  assert.equal(invalidParsed.ok, false);
  if (!invalidParsed.ok) {
    assert.equal(invalidParsed.error, "INVALID_REQUEST");
  }

  console.log("recommend route state spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
