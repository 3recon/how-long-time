import type { PurposeTaskMapping } from "@/types/recommend";

export const purposeTaskMappings: PurposeTaskMapping[] = [
  {
    purposeId: "passport-reissue",
    includeRules: [
      { type: "keyword", keyword: "여권" },
      { type: "keyword", keyword: "재발급" },
      { type: "alias", keyword: "갱신" },
    ],
    excludeRules: [{ type: "keyword", keyword: "수령" }],
    sampleTaskNames: ["여권 재발급", "전자여권 재발급", "여권 갱신"],
    failureMessage:
      "선택한 민원 목적과 일치하는 여권 재발급 업무를 찾지 못했습니다.",
  },
  {
    purposeId: "passport-pickup",
    includeRules: [
      { type: "keyword", keyword: "여권" },
      { type: "keyword", keyword: "수령" },
    ],
    excludeRules: [],
    sampleTaskNames: ["여권 수령", "여권 교부"],
    failureMessage: "선택한 민원 목적과 일치하는 여권 수령 업무를 찾지 못했습니다.",
  },
  {
    purposeId: "certificate-issuance",
    includeRules: [
      { type: "keyword", keyword: "제증명" },
      { type: "keyword", keyword: "증명서" },
    ],
    excludeRules: [{ type: "keyword", keyword: "가족관계" }],
    sampleTaskNames: ["제증명 발급", "민원 증명서 발급"],
    failureMessage: "선택한 민원 목적과 일치하는 제증명 발급 업무를 찾지 못했습니다.",
  },
  {
    purposeId: "family-relation-certificate",
    includeRules: [
      { type: "keyword", keyword: "가족관계" },
      { type: "keyword", keyword: "기본증명" },
    ],
    excludeRules: [],
    sampleTaskNames: ["가족관계증명서 발급", "기본증명서 발급"],
    failureMessage:
      "선택한 민원 목적과 일치하는 가족관계 증명 업무를 찾지 못했습니다.",
  },
  {
    purposeId: "resident-registration",
    includeRules: [
      { type: "keyword", keyword: "주민등록" },
      { type: "keyword", keyword: "등본" },
      { type: "keyword", keyword: "초본" },
      { type: "keyword", keyword: "전입" },
    ],
    excludeRules: [],
    sampleTaskNames: ["주민등록 등초본 발급", "전입신고", "주민등록 정정"],
    failureMessage:
      "선택한 민원 목적과 일치하는 주민등록 업무를 찾지 못했습니다.",
  },
];

export const purposeMappingVersion = "2026-04-stage-2";
