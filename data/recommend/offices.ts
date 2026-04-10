import type { RecommendOfficeCatalogItem } from "@/types/recommend";

export const recommendOfficeCatalog: RecommendOfficeCatalogItem[] = [
  {
    id: "jongno-passport-office",
    name: "종로구청 여권 민원실",
    address: "서울 종로구 삼봉로 43",
    coordinates: {
      lat: 37.5721,
      lng: 126.9794,
    },
    aliases: ["종로구청 여권 민원실", "종로구청"],
    supportedPurposeIds: ["passport-reissue", "passport-pickup"],
  },
  {
    id: "jung-gu-civil-service",
    name: "중구청 민원여권과",
    address: "서울 중구 창경궁로 17",
    coordinates: {
      lat: 37.5641,
      lng: 126.9979,
    },
    aliases: ["중구청 민원여권과", "중구청"],
    supportedPurposeIds: [
      "passport-reissue",
      "passport-pickup",
      "certificate-issuance",
    ],
  },
  {
    id: "seongdong-civil-service",
    name: "성동구청 민원여권과",
    address: "서울 성동구 고산자로 270",
    coordinates: {
      lat: 37.5634,
      lng: 127.0369,
    },
    aliases: ["성동구청 민원여권과", "성동구청"],
    supportedPurposeIds: [
      "passport-pickup",
      "family-relation-certificate",
      "resident-registration",
    ],
  },
];
