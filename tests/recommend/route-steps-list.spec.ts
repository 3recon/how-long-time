import assert from "node:assert/strict";

import { normalizeRouteStepItems } from "../../components/recommend/route-steps-list.tsx";

const [busStep] = normalizeRouteStepItems([
  {
    type: "bus",
    title: "종로09",
    routeName: "종로09",
    from: "시청역1호선",
    to: "서울시청",
    minutes: 12,
    stopCount: 2,
  },
]);

assert.deepEqual(busStep, {
  id: "0",
  kind: "bus",
  title: "종로09",
  description: "시청역1호선 -> 서울시청",
  minutes: 12,
  lineName: "종로09",
  stopCount: 2,
  badges: [],
});

console.log("route steps list spec passed");
