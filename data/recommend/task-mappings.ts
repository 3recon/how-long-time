import type { PurposeTaskMapping } from "@/types/recommend";

export const purposeTaskMappings: PurposeTaskMapping[] = [
  {
    purposeId: "passport-reissue",
    includeRules: [
      { type: "keyword", keyword: "여권신청" },
      { type: "keyword", keyword: "여권 신청" },
      { type: "keyword", keyword: "여권접수" },
      { type: "keyword", keyword: "여권 접수" },
      { type: "keyword", keyword: "여권발급" },
      { type: "keyword", keyword: "여권신고" },
    ],
    excludeRules: [
      { type: "keyword", keyword: "찾기" },
      { type: "keyword", keyword: "수령" },
      { type: "keyword", keyword: "교부" },
    ],
    sampleTaskNames: [
      "4.여권신청",
      "여권 신청",
      "여권접수",
      "여권 접수",
      "신청서 작성후, 여권 신청",
      "여권발급 신청하기\n(4~7번 창구)",
      "여권신고",
    ],
    ambiguousTaskNames: ["여권 심사•교부", "여권접수 교부인원", "여권접수 대기인원"],
    failureMessage:
      "선택한 민원 목적과 일치하는 여권 재발급 업무를 찾지 못했습니다.",
  },
  {
    purposeId: "passport-pickup",
    includeRules: [
      { type: "keyword", keyword: "여권교부" },
      { type: "keyword", keyword: "여권 교부" },
      { type: "keyword", keyword: "여권수령" },
      { type: "keyword", keyword: "여권 수령" },
      { type: "keyword", keyword: "여권찾기" },
      { type: "keyword", keyword: "여권 찾기" },
      { type: "keyword", keyword: "여권 찾는곳" },
    ],
    excludeRules: [{ type: "keyword", keyword: "신청" }],
    sampleTaskNames: [
      "4.여권교부",
      "여권교부",
      "여권 교부",
      "여권수령",
      "여권 수령, \n증명서",
      "여권 찾기",
      "여권찾기",
      "여권 찾는곳",
      "신청한 여권 찾기\n(2번 창구)",
    ],
    ambiguousTaskNames: ["여권 심사•교부"],
    failureMessage: "선택한 민원 목적과 일치하는 여권 수령 업무를 찾지 못했습니다.",
  },
  {
    purposeId: "certificate-issuance",
    includeRules: [
      { type: "keyword", keyword: "제증명" },
      { type: "keyword", keyword: "증명서" },
      { type: "keyword", keyword: "민원발급" },
      { type: "keyword", keyword: "통합민원" },
    ],
    excludeRules: [
      { type: "keyword", keyword: "가족관계" },
      { type: "keyword", keyword: "여권" },
      { type: "keyword", keyword: "지방세" },
      { type: "keyword", keyword: "자동차" },
    ],
    sampleTaskNames: [
      "6.통합제증명 발급",
      "민원발급",
      "제증명 발급",
      "증명서 발급",
      "통합제증명",
      "통합증명발급",
      "통합민원",
      "제증명.민원접수\n(9~11번 창구)",
    ],
    ambiguousTaskNames: [
      "FAX민원",
      "일반민원 접수",
      "3.일반민원 접수",
      "민원접수",
      "법정민원접수",
    ],
    failureMessage: "선택한 민원 목적과 일치하는 제증명 발급 업무를 찾지 못했습니다.",
  },
  {
    purposeId: "family-relation-certificate",
    includeRules: [
      { type: "keyword", keyword: "가족관계" },
      { type: "alias", keyword: "가압관계" },
      { type: "keyword", keyword: "혼인" },
      { type: "keyword", keyword: "출생" },
      { type: "keyword", keyword: "사망" },
    ],
    excludeRules: [
      { type: "keyword", keyword: "여권" },
      { type: "keyword", keyword: "주민등록" },
    ],
    sampleTaskNames: [
      "가족관계 발급•접수",
      "등본,인감/가족관계",
      "5.가족관계등록신고",
      "가족관계등록신고",
      "가족관계신고",
      "출생,혼인/이혼,사망",
      "혼인•사망 등",
      "혼인•이혼•개명•출생•사망",
      "가압관계 신고(혼인,출생,이혼,사망등)",
    ],
    ambiguousTaskNames: ["주민등록•인감,가압관계 어디서나 민원"],
    failureMessage:
      "선택한 민원 목적과 일치하는 가족관계 증명 업무를 찾지 못했습니다.",
  },
  {
    purposeId: "resident-registration",
    includeRules: [
      { type: "keyword", keyword: "주민등록" },
      { type: "keyword", keyword: "등본" },
      { type: "keyword", keyword: "인감" },
      { type: "keyword", keyword: "통합제증명" },
      { type: "keyword", keyword: "증명서 발급" },
    ],
    excludeRules: [
      { type: "keyword", keyword: "가족관계" },
      { type: "keyword", keyword: "여권" },
      { type: "keyword", keyword: "자동차" },
      { type: "keyword", keyword: "지방세" },
    ],
    sampleTaskNames: [
      "등본,인감/가족관계",
      "주민등록•인감,가압관계 어디서나 민원",
      "6.통합제증명 발급",
      "통합제증명",
      "통합증명발급",
      "증명서 발급",
    ],
    ambiguousTaskNames: ["민원발급", "통합민원"],
    failureMessage:
      "선택한 민원 목적과 일치하는 주민등록 업무를 찾지 못했습니다.",
  },
];

export const purposeMappingVersion = "2026-04-stage-2";
