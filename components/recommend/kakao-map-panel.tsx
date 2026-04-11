"use client";

import { useEffect, useRef, useState } from "react";

import {
  buildMapMarkerDataUri,
  getMapLegendItems,
  getMapMarkerPresentation,
} from "@/lib/recommend/map-marker-presentation";
import { formatOfficeDisplayName } from "@/lib/recommend/presentation";
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
          relayout: () => void;
        };
        LatLng: new (lat: number, lng: number) => unknown;
        LatLngBounds: new () => {
          extend: (latLng: unknown) => void;
        };
        Size: new (width: number, height: number) => unknown;
        Point: new (x: number, y: number) => unknown;
        MarkerImage: new (
          src: string,
          size: unknown,
          options?: { offset?: unknown },
        ) => unknown;
        Marker: new (options: {
          map?: unknown;
          position: unknown;
          title?: string;
          image?: unknown;
          zIndex?: number;
        }) => {
          setMap: (map: unknown) => void;
          setZIndex: (zIndex: number) => void;
          setImage: (image: unknown) => void;
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
const mapViewportClassName =
  "h-[380px] w-full sm:h-[420px] lg:h-full lg:min-h-[700px]";

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

function createKakaoMarkerImage(
  kakao: NonNullable<typeof window.kakao>,
  presentation: ReturnType<typeof getMapMarkerPresentation>,
) {
  return new kakao.maps.MarkerImage(
    buildMapMarkerDataUri(presentation),
    new kakao.maps.Size(presentation.width, presentation.height),
    {
      offset: new kakao.maps.Point(
        presentation.width / 2,
        presentation.height - 4,
      ),
    },
  );
}

function getMarkerImageForOffice(
  kakao: NonNullable<typeof window.kakao>,
  office: RecommendedOffice,
  selected: boolean,
) {
  return createKakaoMarkerImage(
    kakao,
    getMapMarkerPresentation({
      kind: "office",
      rank: office.recommendation.rank,
      selected,
    }),
  );
}

function MapLegend(props: { originLabel: string; compact?: boolean }) {
  return (
    <div
      className={
        props.compact
          ? "flex items-center justify-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "pointer-events-none absolute left-4 top-4 z-20 max-w-[calc(100%-2rem)] rounded-[22px] border border-[rgba(17,17,17,0.08)] bg-white/92 px-4 py-3 shadow-[0_18px_34px_rgba(17,17,17,0.08)] backdrop-blur-sm"
      }
    >
      <div className="flex flex-none items-center gap-2 rounded-full border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.92)] px-2.5 py-1.5">
        <span className="text-xs font-semibold text-[var(--foreground)]">
          출발지: {props.originLabel}
        </span>
      </div>
      <div
        className={
          props.compact
            ? "flex flex-none items-center gap-2"
            : "mt-3 flex flex-wrap gap-2.5"
        }
      >
        {getMapLegendItems().map((item) => (
          <div
            key={item.id}
            className="flex flex-none items-center gap-2 rounded-full border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.92)] px-2.5 py-1.5"
          >
            <LegendSwatch itemId={item.id} />
            <div className="leading-none">
              <p className="text-xs font-semibold text-[var(--foreground)]">
                {item.label}
              </p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {item.caption}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendSwatch(props: {
  itemId: ReturnType<typeof getMapLegendItems>[number]["id"];
}) {
  if (props.itemId === "origin") {
    return (
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <span className="absolute h-5 w-5 rounded-full bg-[rgba(125,184,255,0.34)]" />
        <span className="relative h-3 w-3 rounded-full border-2 border-white bg-[#1f3a5f]" />
      </span>
    );
  }

  if (props.itemId === "selected-office") {
    return (
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <span className="absolute h-5 w-5 rounded-full bg-[rgba(245,158,11,0.28)]" />
        <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[#d97706]" />
      </span>
    );
  }

  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center">
      <span className="absolute h-4 w-4 rounded-full bg-[rgba(245,225,164,0.3)]" />
      <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-[#2f2413]" />
    </span>
  );
}

function FallbackMap(props: {
  origin: LocationPoint;
  originLabel: string;
  recommendations: RecommendedOffice[];
  selectedOfficeId: string | null;
  onSelectOffice: (officeId: string) => void;
  reason: string;
}) {
  const points = [
    props.origin,
    ...props.recommendations.map((office) => office.coordinates),
  ];
  const latMin = Math.min(...points.map((point) => point.lat));
  const latMax = Math.max(...points.map((point) => point.lat));
  const lngMin = Math.min(...points.map((point) => point.lng));
  const lngMax = Math.max(...points.map((point) => point.lng));
  const latRange = latMax - latMin || 0.01;
  const lngRange = lngMax - lngMin || 0.01;

  return (
    <div
      className={`relative overflow-hidden bg-[linear-gradient(180deg,rgba(244,238,223,0.98)_0%,rgba(235,227,207,0.98)_100%)] ${mapViewportClassName}`}
    >
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
            <div className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute h-8 w-8 rounded-full bg-[rgba(125,184,255,0.34)]" />
              <span className="relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#1f3a5f] shadow-[0_12px_22px_rgba(31,58,95,0.28)]">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
            </div>
            <div className="rounded-full border border-[rgba(17,17,17,0.08)] bg-white/92 px-3 py-1 text-xs font-semibold shadow-[0_10px_20px_rgba(17,17,17,0.08)]">
              {props.originLabel}
            </div>
          </div>

          {props.recommendations.map((office) => {
            const left =
              12 + ((office.coordinates.lng - lngMin) / lngRange) * 76;
            const top =
              16 + (1 - (office.coordinates.lat - latMin) / latRange) * 66;
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
                  className={`flex items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold text-white shadow-[0_16px_26px_rgba(17,17,17,0.16)] transition-transform duration-200 ${
                    selected
                      ? "h-8 w-8 scale-110 bg-[#d97706]"
                      : "h-6 w-6 bg-[#2f2413] hover:scale-105"
                  }`}
                >
                  {office.recommendation.rank}
                </span>
                <span
                  className={`mt-2 block rounded-full px-3 py-1 text-xs font-semibold shadow-[0_10px_20px_rgba(17,17,17,0.1)] ${
                    selected
                      ? "bg-[#2f2413] text-white"
                      : "bg-white/92 text-[var(--foreground)]"
                  }`}
                >
                  {selected ? `선택 중 · ${office.name}` : office.name}
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
    relayout: () => void;
  } | null>(null);
  const infoWindowRef = useRef<{
    open: (map: unknown, marker: unknown) => void;
    close: () => void;
  } | null>(null);
  const markersRef = useRef<
    Array<{
      officeId: string | null;
      kind: "origin" | "office";
      marker: {
        setMap: (map: unknown) => void;
        setZIndex: (zIndex: number) => void;
        setImage: (image: unknown) => void;
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
      const originLatLng = new kakao.maps.LatLng(origin.lat, origin.lng);
      const initialOffice = recommendations[0] ?? null;

      if (!mapRef.current) {
        mapRef.current = new kakao.maps.Map(mapContainerRef.current, {
          center: originLatLng,
          level: 6,
        });
      }

      const map = mapRef.current;
      map.relayout();
      const bounds = new kakao.maps.LatLngBounds();

      markersRef.current.forEach(({ marker }) => marker.setMap(null));
      markersRef.current = [];
      focusLineRef.current?.setMap(null);
      infoWindowRef.current?.close();

      const originMarker = new kakao.maps.Marker({
        map,
        position: originLatLng,
        title: originLabel,
        image: createKakaoMarkerImage(
          kakao,
          getMapMarkerPresentation({ kind: "origin" }),
        ),
        zIndex: 10,
      });

      markersRef.current.push({
        officeId: null,
        kind: "origin",
        marker: originMarker,
      });
      bounds.extend(originLatLng);

      recommendations.forEach((office) => {
        const position = new kakao.maps.LatLng(
          office.coordinates.lat,
          office.coordinates.lng,
        );
        const marker = new kakao.maps.Marker({
          map,
          position,
          title: formatOfficeDisplayName(office.name),
          image: getMarkerImageForOffice(
            kakao,
            office,
            office.id === initialOffice?.id,
          ),
          zIndex: office.id === initialOffice?.id ? 12 : 5,
        });

        kakao.maps.event.addListener(marker, "click", () => {
          onSelectOffice(office.id);
        });

        markersRef.current.push({
          officeId: office.id,
          kind: "office",
          marker,
        });
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
      map.relayout();
      const selectedPosition = new kakao.maps.LatLng(
        selectedOffice.coordinates.lat,
        selectedOffice.coordinates.lng,
      );

      markersRef.current.forEach(({ officeId, kind, marker }) => {
        if (kind === "origin") {
          marker.setZIndex(10);
          return;
        }

        const isSelected = officeId === selectedOffice.id;
        const office = recommendations.find((item) => item.id === officeId);

        if (office) {
          marker.setImage(getMarkerImageForOffice(kakao, office, isSelected));
        }

        marker.setZIndex(isSelected ? 12 : 5);
      });

      focusLineRef.current?.setMap(null);
      focusLineRef.current = new kakao.maps.Polyline({
        map,
        path: [new kakao.maps.LatLng(origin.lat, origin.lng), selectedPosition],
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
        content: `<div style="padding:10px 12px;min-width:156px;"><div style="font-size:13px;font-weight:700;color:#111;">${selectedOffice.recommendation.rank}순위 - ${selectedOffice.name}</div></div>`,
      });

      if (selectedMarker) {
        infoWindowRef.current.open(map, selectedMarker);
      }

      map.setLevel(5);
      map.panTo(selectedPosition);
    });
  }, [origin.lat, origin.lng, recommendations, selectedOfficeId, sdkStatus]);

  return (
    <section className="soft-card overflow-hidden rounded-[28px] border-[rgba(17,17,17,0.12)] lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <div className="border-b border-[var(--line)] px-5 py-4 sm:px-6">
        <MapLegend originLabel={originLabel} compact />
      </div>
      <div className="relative lg:flex-1">
        <div
          ref={mapContainerRef}
          className={`${mapViewportClassName} bg-[linear-gradient(180deg,#fffdf8_0%,#ebe3cf_100%)]`}
        />
        {sdkStatus !== "ready" ? (
          <div className="absolute inset-0">
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
          </div>
        ) : null}

        {recommendations.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[rgba(255,255,255,0.72)] px-6 text-center backdrop-blur-sm">
            <p className="text-base font-semibold">
              추천 결과가 준비되면 지도와 마커를 함께 보여줍니다.
            </p>
            <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
              출발지와 민원 목적을 입력한 뒤 추천 요청을 보내면 사용자 위치와
              민원실 후보를 같은 화면에서 비교할 수 있습니다.
            </p>
          </div>
        ) : null}

        {sdkStatus === "loading" ? (
          <div className="absolute inset-x-4 bottom-4 rounded-full bg-white/92 px-4 py-2 text-sm font-medium shadow-[0_10px_28px_rgba(17,17,17,0.08)]">
            지도를 불러오는 중입니다.
          </div>
        ) : null}
      </div>
    </section>
  );
}
