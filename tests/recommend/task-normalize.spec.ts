import assert from "node:assert/strict";

import {
  normalizeTaskName,
  tokenizeTaskName,
} from "../../lib/recommend/task-normalize.ts";

assert.equal(normalizeTaskName("4.여권신청"), "여권신청");

assert.equal(
  normalizeTaskName("여권발급 신청하기\n(4~7번 창구)"),
  "여권발급 신청하기",
);

assert.equal(
  normalizeTaskName("주민등록•인감,가압관계 어디서나 민원"),
  "주민등록 인감 가족관계 어디서나 민원",
);

assert.deepEqual(tokenizeTaskName("등본,인감/가족관계"), [
  "등본",
  "인감",
  "가족관계",
]);

assert.deepEqual(tokenizeTaskName("출생,혼인/이혼,사망"), [
  "출생",
  "혼인",
  "이혼",
  "사망",
]);

console.log("task-normalize spec passed");
