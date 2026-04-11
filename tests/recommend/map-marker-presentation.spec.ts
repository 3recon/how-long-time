import assert from "node:assert/strict";

import {
  getMapLegendItems,
  getMapMarkerPresentation,
} from "../../lib/recommend/map-marker-presentation.ts";

async function main() {
  const originMarker = getMapMarkerPresentation({
    kind: "origin",
  });
  const defaultOfficeMarker = getMapMarkerPresentation({
    kind: "office",
    rank: 2,
    selected: false,
  });
  const selectedOfficeMarker = getMapMarkerPresentation({
    kind: "office",
    rank: 1,
    selected: true,
  });

  assert.equal(originMarker.label, "출발");
  assert.equal(originMarker.width > defaultOfficeMarker.width, true);
  assert.notEqual(originMarker.palette.fill, defaultOfficeMarker.palette.fill);

  assert.equal(defaultOfficeMarker.label, "2");
  assert.equal(selectedOfficeMarker.label, "1");
  assert.notEqual(
    selectedOfficeMarker.palette.fill,
    defaultOfficeMarker.palette.fill,
  );
  assert.equal(
    selectedOfficeMarker.palette.haloOpacity >
      defaultOfficeMarker.palette.haloOpacity,
    true,
  );

  assert.deepEqual(
    getMapLegendItems().map((item) => item.label),
    ["현재 위치", "민원실", "선택된 민원실"],
  );

  console.log("recommend map marker presentation spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
