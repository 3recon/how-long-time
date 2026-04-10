import type { PurposeCatalogItem } from "../../contracts/recommend.js";

export const purposeCatalog: PurposeCatalogItem[] = [
  {
    id: "passport-reissue",
    label: "여권 재발급",
    description: "기존 여권 갱신 또는 재발급 신청",
    keywords: ["여권", "재발급", "갱신"],
    demoScenarioId: "demo-seoul-cityhall-passport",
  },
  {
    id: "passport-pickup",
    label: "여권 수령",
    description: "발급 완료된 여권 수령",
    keywords: ["여권", "수령", "찾기"],
    demoScenarioId: "demo-seoul-cityhall-passport",
  },
  {
    id: "certificate-issuance",
    label: "증명서 발급",
    description: "일반 민원 증명서 발급",
    keywords: ["증명서", "서류", "발급"],
    demoScenarioId: "demo-seoul-cityhall-certificate",
  },
  {
    id: "family-relation-certificate",
    label: "가족관계 증명",
    description: "가족관계증명서, 기본증명서 등 발급",
    keywords: ["가족관계", "기본증명", "증명서"],
    demoScenarioId: "demo-seoul-cityhall-family",
  },
  {
    id: "resident-registration",
    label: "주민등록 민원",
    description: "등본 또는 초본 등 주민등록 관련 민원",
    keywords: ["주민등록", "등본", "초본", "전입"],
    demoScenarioId: "demo-seoul-cityhall-resident",
  },
];
