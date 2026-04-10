import type { RecommendPurposeId } from "@/types/recommend";

export const purposeOptions: Array<{
  id: RecommendPurposeId;
  label: string;
  description: string;
}> = [
  {
    id: "passport-reissue",
    label: "여권 재발급",
    description: "기존 여권 갱신이나 재발급이 필요할 때",
  },
  {
    id: "passport-pickup",
    label: "여권 수령",
    description: "발급 완료된 여권을 방문 수령할 때",
  },
  {
    id: "certificate-issuance",
    label: "증명서 발급",
    description: "일반 민원 서류를 빠르게 발급받고 싶을 때",
  },
  {
    id: "family-relation-certificate",
    label: "가족관계 증명",
    description: "가족관계증명서나 기본증명서가 필요할 때",
  },
  {
    id: "resident-registration",
    label: "주민등록 민원",
    description: "등본, 초본, 전입 관련 업무를 처리할 때",
  },
];

export function getPurposeLabel(purposeId: string): string {
  return purposeOptions.find((purpose) => purpose.id === purposeId)?.label ?? purposeId;
}
