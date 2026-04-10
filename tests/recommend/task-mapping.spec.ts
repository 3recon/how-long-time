import assert from "node:assert/strict";

import { purposeCatalog } from "../../data/recommend/purposes.ts";
import {
  filterWaitingItemsByPurpose,
  getPurposeTaskMapping,
  matchPurposeForTaskName,
} from "../../lib/recommend/task-mapping.ts";
import type { PublicDataWaitingItem } from "../../types/public-data.ts";

const observedItems: PublicDataWaitingItem[] = [
  {
    officeName: "종로구청",
    taskName: "4.여권신청",
    waitingCount: 8,
    totalDateTime: "20260410103000",
  },
  {
    officeName: "중구청",
    taskName: "신청한 여권 찾기\n(2번 창구)",
    waitingCount: 3,
    totalDateTime: "20260410103100",
  },
  {
    officeName: "동대문구청",
    taskName: "여권 심사•교부",
    waitingCount: 5,
    totalDateTime: "20260410103200",
  },
  {
    officeName: "성동구청",
    taskName: "여권신고",
    waitingCount: 1,
    totalDateTime: "20260410103300",
  },
  {
    officeName: "광진구청",
    taskName: "출생,혼인/이혼,사망",
    waitingCount: 0,
    totalDateTime: "20260410192303",
  },
  {
    officeName: "서대문구청",
    taskName: "주민등록•인감,가압관계 어디서나 민원",
    waitingCount: 12,
    totalDateTime: "20260410103400",
  },
  {
    officeName: "마포구청",
    taskName: "등본,인감/가족관계",
    waitingCount: 7,
    totalDateTime: "20260410103500",
  },
  {
    officeName: "영등포구청",
    taskName: "제증명.민원접수\n(9~11번 창구)",
    waitingCount: 2,
    totalDateTime: "20260410103600",
  },
  {
    officeName: "강남구청",
    taskName: "지방세제증명",
    waitingCount: 4,
    totalDateTime: "20260410103700",
  },
];

assert.deepEqual(
  purposeCatalog.map((purpose) => purpose.id),
  [
    "passport-reissue",
    "passport-pickup",
    "certificate-issuance",
    "family-relation-certificate",
    "resident-registration",
  ],
);

assert.equal(
  getPurposeTaskMapping("passport-reissue").failureMessage,
  "선택한 민원 목적과 일치하는 여권 재발급 업무를 찾지 못했습니다.",
);

assert.deepEqual(matchPurposeForTaskName("passport-reissue", "4.여권신청"), {
  taskName: "4.여권신청",
  ruleType: "keyword",
});

assert.equal(
  matchPurposeForTaskName(
    "passport-reissue",
    "신청한 여권 찾기\n(2번 창구)",
  ),
  null,
);

assert.equal(matchPurposeForTaskName("passport-reissue", "여권 심사•교부"), null);
assert.equal(matchPurposeForTaskName("passport-reissue", "여권신고"), null);

assert.deepEqual(
  matchPurposeForTaskName("passport-pickup", "신청한 여권 찾기\n(2번 창구)"),
  {
    taskName: "신청한 여권 찾기\n(2번 창구)",
    ruleType: "keyword",
  },
);

assert.equal(matchPurposeForTaskName("passport-pickup", "4.여권신청"), null);

assert.deepEqual(
  matchPurposeForTaskName(
    "family-relation-certificate",
    "가압관계 신고(혼인,출생,이혼,사망등)",
  ),
  {
    taskName: "가압관계 신고(혼인,출생,이혼,사망등)",
    ruleType: "alias",
  },
);

assert.equal(
  matchPurposeForTaskName(
    "family-relation-certificate",
    "주민등록•인감,가압관계 어디서나 민원",
  ),
  null,
);

assert.deepEqual(
  matchPurposeForTaskName(
    "resident-registration",
    "주민등록•인감,가압관계 어디서나 민원",
  ),
  {
    taskName: "주민등록•인감,가압관계 어디서나 민원",
    ruleType: "keyword",
  },
);

assert.deepEqual(
  matchPurposeForTaskName("resident-registration", "등본,인감/가족관계"),
  {
    taskName: "등본,인감/가족관계",
    ruleType: "keyword",
  },
);

assert.deepEqual(
  matchPurposeForTaskName("certificate-issuance", "제증명.민원접수\n(9~11번 창구)"),
  {
    taskName: "제증명.민원접수\n(9~11번 창구)",
    ruleType: "keyword",
  },
);

assert.equal(
  matchPurposeForTaskName("certificate-issuance", "지방세제증명"),
  null,
);

assert.deepEqual(
  filterWaitingItemsByPurpose(observedItems, "passport-reissue").map(
    (entry) => entry.item.taskName,
  ),
  ["4.여권신청"],
);

assert.deepEqual(
  filterWaitingItemsByPurpose(observedItems, "passport-pickup").map(
    (entry) => entry.item.taskName,
  ),
  ["신청한 여권 찾기\n(2번 창구)"],
);

assert.deepEqual(
  filterWaitingItemsByPurpose(observedItems, "family-relation-certificate").map(
    (entry) => entry.item.taskName,
  ),
  ["출생,혼인/이혼,사망"],
);

assert.deepEqual(
  filterWaitingItemsByPurpose(observedItems, "resident-registration").map(
    (entry) => entry.item.taskName,
  ),
  ["주민등록•인감,가압관계 어디서나 민원", "등본,인감/가족관계"],
);

assert.deepEqual(
  filterWaitingItemsByPurpose(observedItems, "certificate-issuance").map(
    (entry) => entry.item.taskName,
  ),
  ["제증명.민원접수\n(9~11번 창구)"],
);

console.log("task-mapping spec passed");
