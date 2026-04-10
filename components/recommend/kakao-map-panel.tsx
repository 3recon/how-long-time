"use client";

import { useEffect, useRef, useState } from "react";

import type { LocationPoint, RecommendedOffice } from "@/types/recommend";

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (
          container: HTMLElement,
          options: { center: unknown; level: number },
        ) => {
          setBounds: (
            bounds: unknown,
            paddingTop?: number,
            paddingRight?: number,
            paddingBottom?: number,
            paddingLeft?: number,
          ) => void;
          panTo: (position: unknown) => void;
          setLevel: (level: number) => void;
        };
        LatLng: new (lat: number, lng: number) => unknown;
        LatLngBounds: new () => {
          extend: (latLng: unknown) => void;
        };
        Marker: new (options: {
          map?: unknown;
          position: unknown;
          title?: string;
          zIndex?: number;
        }) => {
          setMap: (map: unknown) => void;
          setZIndex: (zIndex: number) => void;
        };
        Polyline: new (options: {
          map?: unknown;
          path: unknown[];
          strokeWeight?: number;
          strokeColor?: string;
          strokeOpacity?: number;
          strokeStyle?: string;
        }) => {
          setMap: (map: unknown) => void;
        };
        InfoWindow: new (options: { content: string }) => {
          open: (map: unknown, marker: unknown) => void;
          close: () => void;
        };
        event: {
          addListener: (
            target: unknown,
            type: string,
            handler: () => void,
          ) => void;
        };
      };
    };
  }
}

type KakaoSdkStatus = "idle" | "loading" | "ready" | "error" | "missing-key";

let kakaoMapSdkPromise: Promise<void> | null = null;

function loadKakaoMapSdk(appKey: string): Promise<void> {
  if (typeof window === "undefined" || window.kakao?.maps) {
    return Promise.resolve();
  }

  if (kakaoMapSdkPromise) {
    return kakaoMapSdkPromise;
  }

  kakaoMapSdkPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      "kakao-map-sdk",
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Kakao Map SDK를 불러오지 못했습니다.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${appKey}`;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Kakao Map SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  return kakaoMapSdkPromise;
}

export function KakaoMapPanel(props: {
  appKey: string;
  origin: LocationPoint;
  originLabel: string;
  recommendations: RecommendedOffice[];
  selectedOfficeId: string | null;
  onSelectOffice: (officeId: string) => void;
}) {
  const {
    appKey,
    origin,
    originLabel,
    recommendations,
    selectedOfficeId,
    onSelectOffice,
  } = props;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{
    setBounds: (
      bounds: unknown,
      paddingTop?: number,
      paddingRight?: number,
      paddingBottom?: number,
      paddingLeft?: number,
    ) => void;
    panTo: (position: unknown) => void;
    setLevel: (level: number) => void;
  } | null>(null);
  const infoWindowRef = useRef<{
    open: (map: unknown, marker: unknown) => void;
    close: () => void;
  } | null>(null);
  const markersRef = useRef<
    Array<{
      officeId: string | null;
      marker: {
        setMap: (map: unknown) => void;
        setZIndex: (zIndex: number) => void;
      };
    }>
  >([]);
  const focusLineRef = useRef<{ setMap: (map: unknown) => void } | null>(null);
  const [sdkStatus, setSdkStatus] = useState<KakaoSdkStatus>(
    appKey ? "loading" : "missing-key",
  );

  useEffect(() => {
    if (!appKey) {
      return;
    }

    let cancelled = false;

    loadKakaoMapSdk(appKey)
      .then(() => {
        if (!cancelled) {
          setSdkStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSdkStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [appKey]);

  useEffect(() => {
    if (
      sdkStatus !== "ready" ||
      !mapContainerRef.current ||
      recommendations.length === 0
    ) {
      return;
    }

    let cancelled = false;

    window.kakao?.maps.load(() => {
      if (cancelled || !mapContainerRef.current || !window.kakao) {
        return;
      }

      const kakao = window.kakao;
      const originLatLng = new kakao.maps.LatLng(
        origin.lat,
        origin.lng,
      );

      if (!mapRef.current) {
        mapRef.current = new kakao.maps.Map(mapContainerRef.current, {
          center: originLatLng,
          level: 6,
        });
      }

      const map = mapRef.current;
      const bounds = new kakao.maps.LatLngBounds();

      markersRef.current.forEach(({ marker }) => marker.setMap(null));
      markersRef.current = [];
      focusLineRef.current?.setMap(null);
      infoWindowRef.current?.close();

      const originMarker = new kakao.maps.Marker({
        map,
        position: originLatLng,
        title: originLabel,
        zIndex: 10,
      });

      markersRef.current.push({ officeId: null, marker: originMarker });
      bounds.extend(originLatLng);

      recommendations.forEach((office) => {
        const position = new kakao.maps.LatLng(
          office.coordinates.lat,
          office.coordinates.lng,
        );
        const marker = new kakao.maps.Marker({
          map,
          position,
          title: office.name,
          zIndex: office.id === selectedOfficeId ? 12 : 5,
        });

        kakao.maps.event.addListener(marker, "click", () => {
          onSelectOffice(office.id);
        });

        markersRef.current.push({ officeId: office.id, marker });
        bounds.extend(position);
      });

      map.setBounds(bounds, 56, 56, 56, 56);
    });

    return () => {
      cancelled = true;
    };
  }, [
    onSelectOffice,
    origin.lat,
    origin.lng,
    originLabel,
    recommendations,
    selectedOfficeId,
    sdkStatus,
  ]);

  useEffect(() => {
    if (
      sdkStatus !== "ready" ||
      !window.kakao ||
      !mapRef.current ||
      recommendations.length === 0
    ) {
      return;
    }

    const selectedOffice =
      recommendations.find((office) => office.id === selectedOfficeId) ??
      recommendations[0];

    if (!selectedOffice) {
      return;
    }

    window.kakao.maps.load(() => {
      if (!window.kakao || !mapRef.current) {
        return;
      }

      const kakao = window.kakao;
      const map = mapRef.current;
      const selectedPosition = new kakao.maps.LatLng(
        selectedOffice.coordinates.lat,
        selectedOffice.coordinates.lng,
      );

      markersRef.current.forEach(({ officeId, marker }) => {
        marker.setZIndex(officeId === selectedOffice.id ? 12 : 5);
      });

      focusLineRef.current?.setMap(null);
      focusLineRef.current = new kakao.maps.Polyline({
        map,
        path: [
          new kakao.maps.LatLng(origin.lat, origin.lng),
          selectedPosition,
        ],
        strokeWeight: 3,
        strokeColor: "#f59e0b",
        strokeOpacity: 0.95,
        strokeStyle: "solid",
      });

      const selectedMarker = markersRef.current.find(
        ({ officeId }) => officeId === selectedOffice.id,
      )?.marker;

      infoWindowRef.current?.close();
      infoWindowRef.current = new kakao.maps.InfoWindow({
        content: `<div style="padding:10px 12px;font-size:13px;font-weight:700;color:#111;">${selectedOffice.name}</div>`,
      });

      if (selectedMarker) {
        infoWindowRef.current.open(map, selectedMarker);
      }

      map.setLevel(5);
      map.panTo(selectedPosition);
    });
  }, [
    origin.lat,
    origin.lng,
    recommendations,
    selectedOfficeId,
    sdkStatus,
  ]);

  const selectedOffice =
    recommendations.find((office) => office.id === selectedOfficeId) ??
    recommendations[0] ??
    null;

  return (
    <section className="soft-card overflow-hidden rounded-[28px] border-[rgba(17,17,17,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
            Kakao Map
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
            위치 비교 보기
          </h3>
        </div>
        {selectedOffice ? (
          <div className="rounded-full border border-[rgba(17,17,17,0.12)] bg-[rgba(255,212,0,0.14)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)]">
            현재 포커스: {selectedOffice.name}
          </div>
        ) : null}
      </div>

      <div className="relative">
        <div
          ref={mapContainerRef}
          className="h-[420px] w-full bg-[linear-gradient(180deg,#fffdf4_0%,#fff7d6_100%)] sm:h-[500px]"
        />

        {recommendations.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[rgba(255,255,255,0.72)] px-6 text-center backdrop-blur-sm">
            <p className="text-base font-semibold">
              추천 결과가 준비되면 지도와 마커를 함께 보여줍니다.
            </p>
            <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
              출발지와 민원 목적을 입력한 뒤 추천 요청을 보내면 사용자 위치와 민원실
              후보를 같은 화면에서 비교할 수 있습니다.
            </p>
          </div>
        ) : null}

        {sdkStatus === "loading" ? (
          <div className="absolute inset-x-4 top-4 rounded-full bg-white/90 px-4 py-2 text-sm font-medium shadow-[0_10px_28px_rgba(17,17,17,0.08)]">
            지도를 불러오는 중입니다.
          </div>
        ) : null}

        {sdkStatus === "missing-key" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.84)] px-6 text-center">
            <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
              `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`가 없어 지도를 렌더링할 수 없습니다.
              추천 리스트는 계속 확인할 수 있습니다.
            </p>
          </div>
        ) : null}

        {sdkStatus === "error" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.84)] px-6 text-center">
            <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
              Kakao 지도 SDK를 불러오지 못했습니다. 네트워크 또는 앱 키 설정을
              확인해 주세요.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
