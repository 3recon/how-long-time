import assert from "node:assert/strict";

import { getPublicDataDemoFallbackNotice } from "../../components/recommend/recommend-results-page.tsx";

assert.equal(
  getPublicDataDemoFallbackNotice({
    error: "UPSTREAM_API_ERROR",
    details: "\uacf5\uacf5\ub370\uc774\ud130 API \ud638\ucd9c\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4. (502)",
    contractVersion: "2026-04-stage-7",
  }),
  "\uacf5\uacf5\ub370\uc774\ud130 API \uc7a5\uc560\ub85c \uc778\ud574 demo fallback \uacb0\uacfc\ub85c \uc804\ud658\ud588\uc2b5\ub2c8\ub2e4.",
);

assert.equal(
  getPublicDataDemoFallbackNotice({
    error: "UPSTREAM_API_ERROR",
    details: "ODsay API \ud638\ucd9c\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4. (502)",
    contractVersion: "2026-04-stage-7",
  }),
  null,
);

assert.equal(getPublicDataDemoFallbackNotice(null), null);

console.log("recommend results fallback spec passed");
