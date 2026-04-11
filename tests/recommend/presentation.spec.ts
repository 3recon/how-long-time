import assert from "node:assert/strict";

import { createClientDemoRecommendResponse } from "../../lib/recommend/client-demo.ts";
import {
  formatOfficeDisplayName,
  getSelectedOfficeSummary,
} from "../../lib/recommend/presentation.ts";

async function main() {
  assert.equal(formatOfficeDisplayName("성동구청 민원여권과"), "성동구청");
  assert.equal(formatOfficeDisplayName("종로구청 여권 민원실"), "종로구청");
  assert.equal(formatOfficeDisplayName("중구청 민원실"), "중구청");
  assert.equal(formatOfficeDisplayName("명동주민센터"), "명동주민센터");

  const response = createClientDemoRecommendResponse({
    purposeId: "passport-pickup",
    originLabel: "서울시청",
    origin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "demo",
  });

  const defaultSummary = getSelectedOfficeSummary(response.recommendations, null);
  assert.ok(defaultSummary);
  assert.equal(defaultSummary?.id, response.recommendations[0]?.id);
  assert.equal(defaultSummary?.name, formatOfficeDisplayName(response.recommendations[0]?.name ?? ""));
  assert.equal(
    defaultSummary?.totalMinutes,
    response.recommendations[0]?.recommendation.totalMinutes,
  );
  assert.equal(
    defaultSummary?.estimatedWaitingMinutes,
    response.recommendations[0]?.waiting.estimatedMinutes,
  );
  assert.equal(defaultSummary?.travelMinutes, response.recommendations[0]?.travel.minutes);

  const selectedId = response.recommendations[1]?.id ?? null;
  const selectedSummary = getSelectedOfficeSummary(
    response.recommendations,
    selectedId,
  );
  assert.ok(selectedSummary);
  assert.equal(selectedSummary?.id, selectedId);
  assert.equal(selectedSummary?.rank, response.recommendations[1]?.recommendation.rank);
  assert.equal(
    selectedSummary?.name,
    formatOfficeDisplayName(response.recommendations[1]?.name ?? ""),
  );
  assert.equal(
    selectedSummary?.totalMinutes,
    response.recommendations[1]?.recommendation.totalMinutes,
  );
  assert.equal(
    selectedSummary?.taskSummary,
    response.recommendations[1]?.supportedTaskMatches.map((task) => task.taskName).join(", "),
  );

  const fallbackSummary = getSelectedOfficeSummary(
    response.recommendations,
    "missing-office",
  );
  assert.equal(fallbackSummary?.id, response.recommendations[0]?.id);

  assert.equal(getSelectedOfficeSummary([], null), null);

  console.log("recommend presentation spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
