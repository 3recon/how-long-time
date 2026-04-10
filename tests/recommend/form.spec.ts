import assert from "node:assert/strict";

import {
  buildDemoRecommendRequest,
  validateRecommendForm,
} from "../../lib/recommend/form.ts";

async function main() {
  assert.deepEqual(
    validateRecommendForm({
      originLabel: "",
      purposeId: "",
    }),
    {
      originLabel: "출발지를 입력해 주세요.",
      purposeId: "민원 목적을 선택해 주세요.",
    },
  );

  assert.deepEqual(
    validateRecommendForm({
      originLabel: "  서울시청  ",
      purposeId: "passport-reissue",
    }),
    {},
  );

  assert.deepEqual(
    buildDemoRecommendRequest({
      originLabel: "  서울시청  ",
      purposeId: "passport-reissue",
      coordinates: null,
      fallbackOrigin: {
        lat: 37.5665,
        lng: 126.978,
      },
    }),
    {
      purposeId: "passport-reissue",
      originLabel: "서울시청",
      origin: {
        lat: 37.5665,
        lng: 126.978,
      },
      mode: "demo",
    },
  );

  assert.deepEqual(
    buildDemoRecommendRequest({
      originLabel: "내 위치",
      purposeId: "resident-registration",
      coordinates: {
        lat: 37.57,
        lng: 127.01,
      },
      fallbackOrigin: {
        lat: 37.5665,
        lng: 126.978,
      },
    }),
    {
      purposeId: "resident-registration",
      originLabel: "내 위치",
      origin: {
        lat: 37.57,
        lng: 127.01,
      },
      mode: "demo",
    },
  );

  console.log("recommend form spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
