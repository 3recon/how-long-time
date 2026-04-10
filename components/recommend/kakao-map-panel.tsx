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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function FallbackMap(props: {
  origin: LocationPoint;
  originLabel: string;
  recommendations: RecommendedOffice[];
  selectedOfficeId: string | null;
  onSelectOffice: (officeId: string) => void;
  reason: string;
}) {
  const points = [props.origin, ...props.recommendations.map((office) => office.coordinates)];
  const latMin = Math.min(...points.map((point) => point.lat));
  const latMax = Math.max(...points.map((point) => point.lat));
  const lngMin = Math.min(...points.map((point) => point.lng));
  const lngMax = Math.max(...points.map((point) => point.lng));
  const latRange = latMax - latMin || 0.01;
  const lngRange = lngMax - lngMin || 0.01;

  return (
    <div className="relative h-[380px] overflow-hidden bg-[linear-gradient(180deg,rgba(244,238,223,0.98)_0%,rgba(235,227,207,0.98)_100%)] sm:h-[420px] lg:h-full">
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(17,17,17,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute left-4 top-4 right-4 rounded-[20px] border border-[rgba(17,17,17,0.08)] bg-white/88 px-4 py-3 text-sm shadow-[0_18px_34px_rgba(17,17,17,0.08)] backdrop-blur-sm">
        <p className="font-semibold">지도 fallback 보기</p>
        <p className="mt-1 leading-6 text-[var(--muted)]">{props.reason}</p>
      </div>

      <div className="absolute inset-0 px-8 pb-8 pt-24">
        <div className="relative h-full rounded-[28px] border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.26)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
          <div
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
            style={{
              left: "14%",
              top: "74%",
            }}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[var(--accent-blue)] shadow-[0_12px_22px_rgba(31,58,95,0.28)]" />
            <div className="rounded-full bg-white/92 px-3 py-1 text-xs font-semibold shadow-[0_10px_20px_rgba(17,17,17,0.08)]">
              {props.originLabel}
            </div>
          </div>

          {props.recommendations.map((office) => {
            const left = 12 + ((office.coordinates.lng - lngMin) / lngRange) * 76;
            const top = 16 + (1 - (office.coordinates.lat - latMin) / latRange) * 66;
            const selected = office.id === props.selectedOfficeId;

            return (
              <button
                key={office.id}
                type="button"
                onClick={() => props.onSelectOffice(office.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${clamp(left, 12, 88)}%`,
                  top: `${clamp(top, 14, 84)}%`,
                }}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold text-white shadow-[0_16px_26px_rgba(17,17,17,0.16)] transition-transform duration-200 ${
                    selected
                      ? "scale-110 bg-[var(--accent-red)]"
                      : "bg-[var(--foreground)] hover:scale-105"
                  }`}
                >
                  {office.recommendation.rank}
                </span>
                <span
                  className={`mt-2 block rounded-full px-3 py-1 text-xs font-semibold shadow-[0_10px_20px_rgba(17,17,17,0.1)] ${
                    selected
                      ? "bg-[var(--foreground)] text-white"
                      : "bg-white/92 text-[var(--foreground)]"
                  }`}
                >
                  {office.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
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
          <div className="rounded-full border border-[rgba(17,17,17,0.12)] bg-[rgba(211,166,63,0.14)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)]">
            현재 포커스: {selectedOffice.name}
          </div>
        ) : null}
      </div>

      <div className="relative">
        {sdkStatus === "ready" ? (
          <div
            ref={mapContainerRef}
          className="h-[380px] w-full bg-[linear-gradient(180deg,#fffdf8_0%,#ebe3cf_100%)] sm:h-[420px] lg:h-full"
          />
        ) : (
          <FallbackMap
            origin={origin}
            originLabel={originLabel}
            recommendations={recommendations}
            selectedOfficeId={selectedOfficeId}
            onSelectOffice={onSelectOffice}
            reason={
              sdkStatus === "missing-key"
                ? "Kakao 앱 키가 없어 좌표 기반 fallback 지도를 보여줍니다."
                : sdkStatus === "error"
                  ? "브라우저에서 Kakao SDK를 불러오지 못해 fallback 지도를 보여줍니다."
                  : "지도를 준비하는 동안 fallback 지도를 먼저 보여줍니다."
            }
          />
        )}

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

      </div>
    </section>
  );
}
