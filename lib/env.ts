export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "민원나우",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
  kakaoMapAppKey: process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? "",
  enableDemoMode: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE !== "false",
  defaultCenter: {
    lat: Number(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? "37.5665"),
    lng: Number(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? "126.9780"),
  },
} as const;
