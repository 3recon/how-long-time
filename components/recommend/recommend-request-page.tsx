"use client";

import { type FormEvent, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

import {
  PurposeOptionCard,
} from "@/components/recommend/recommend-ui";
import { appConfig } from "@/lib/env";
import {
  resolveRecommendRequest,
  validateRecommendForm,
} from "@/lib/recommend/form";
import { buildRecommendResultsHref } from "@/lib/recommend/route-state";
import type {
  LocationPoint,
  RecommendPurposeId,
} from "@/types/recommend";
import { purposeOptions } from "@/data/recommend/purpose-options";

function readValue(
  input: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = input[key];
  return Array.isArray(value) ? value[0] : value;
}

function parseInitialCoordinates(
  searchParams: Record<string, string | string[] | undefined>,
): LocationPoint | null {
  const lat = Number(readValue(searchParams, "lat"));
  const lng = Number(readValue(searchParams, "lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

export function RecommendRequestPage(props: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const router = useRouter();
  const purposeDialogId = useId();
  const [originLabel, setOriginLabel] = useState(
    readValue(props.searchParams, "originLabel") ?? "",
  );
  const [purposeId, setPurposeId] = useState(
    readValue(props.searchParams, "purposeId") ?? "",
  );
  const [coordinates, setCoordinates] = useState<LocationPoint | null>(
    parseInitialCoordinates(props.searchParams) ?? appConfig.defaultCenter,
  );
  const [fieldErrors, setFieldErrors] = useState<{
    originLabel?: string;
    purposeId?: string;
  }>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [preferCurrentCoordinates, setPreferCurrentCoordinates] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPurposePickerOpen, setIsPurposePickerOpen] = useState(false);
  const [draftPurposeId, setDraftPurposeId] = useState("");

  const selectedPurpose =
    purposeOptions.find((purpose) => purpose.id === purposeId) ?? null;
  const draftPurpose =
    purposeOptions.find((purpose) => purpose.id === draftPurposeId) ?? null;

  useEffect(() => {
    if (!isPurposePickerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPurposePickerOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isPurposePickerOpen]);

  function openPurposePicker() {
    setDraftPurposeId(purposeId);
    setIsPurposePickerOpen(true);
  }

  function handleConfirmOriginSelection() {
    setLocationStatus("입력한 위치를 선택합니다");
  }


  async function handleUseCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setRequestError("브라우저에서 현재 위치 기능을 지원하지 않습니다.");
      return;
    }

    setIsLocating(true);
    setRequestError(null);
    setLocationStatus("현재 위치를 확인하고 있습니다.");

    navigator.geolocation.getCurrentPosition(
      () => {
        setCoordinates(appConfig.defaultCenter);
        setPreferCurrentCoordinates(false);
        setOriginLabel("서울시청");
        setFieldErrors((current) => ({ ...current, originLabel: undefined }));
        setLocationStatus("");
        setIsLocating(false);
      },
      () => {
        setRequestError(
          "현재 위치를 가져오지 못했습니다. 출발지를 직접 입력해 주세요.",
        );
        setLocationStatus(
          "위치 권한이 없으면 서울시청 기준 demo 결과를 확인할 수 있습니다.",
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }

  async function geocodeOrigin(originLabelToResolve: string) {
    const response = await fetch(
      `/api/geocode?originLabel=${encodeURIComponent(originLabelToResolve)}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    const body = (await response.json()) as
      | {
          originLabel: string;
          resolvedAddress: string;
          coordinates: LocationPoint;
        }
      | {
          error?: string;
          details?: string;
        };

    if (!response.ok) {
      throw new Error(
        "details" in body && typeof body.details === "string"
          ? body.details
          : "출발지 좌표를 확인하지 못했습니다. 다시 시도해 주세요.",
      );
    }

    return {
      originLabel:
        "resolvedAddress" in body ? body.resolvedAddress : originLabelToResolve,
      coordinates:
        "coordinates" in body
          ? body.coordinates
          : (() => {
              throw new Error("출발지 좌표 응답이 올바르지 않습니다.");
            })(),
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateRecommendForm({
      originLabel,
      purposeId,
    });

    setFieldErrors(nextErrors);
    setRequestError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const requestPayload = await resolveRecommendRequest({
        originLabel,
        purposeId: purposeId as RecommendPurposeId,
        coordinates,
        fallbackOrigin: appConfig.defaultCenter,
        mode: "demo",
        preferCurrentCoordinates,
        geocodeOrigin,
      });

      setCoordinates(requestPayload.origin);
      router.push(buildRecommendResultsHref(requestPayload));
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "출발지 좌표를 확인하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(211,166,63,0.24),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(31,58,95,0.08),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1040px] flex-col justify-center px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-center text-5xl font-semibold leading-[0.94] tracking-[-0.08em] text-balance sm:text-[4.4rem]">
          민원, <span className="text-[#245c9a]">어디가?</span>
        </h1>

        <section className="soft-card min-h-[460px] w-full rounded-[36px] border-[rgba(17,17,17,0.08)] p-6 sm:p-8 lg:p-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="originLabel"
                  className="text-sm font-semibold text-[var(--foreground)]"
                >
                  출발지
                </label>
              </div>

              <div className="rounded-[28px] border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_20px_44px_rgba(17,17,17,0.06)] sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <input
                    id="originLabel"
                    value={originLabel}
                    onChange={(event) => {
                      setOriginLabel(event.target.value);
                      if (fieldErrors.originLabel) {
                        setFieldErrors((current) => ({
                          ...current,
                          originLabel: undefined,
                        }));
                      }
                    }}
                    placeholder="예)서울시청, 홍대입구역, 잠실역, 건대입구역, 강남역, 성수역"
                    className="min-h-12 w-full flex-1 border-b border-[rgba(17,17,17,0.12)] bg-transparent px-0 pb-3 text-base outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent-blue)]"
                    aria-invalid={Boolean(fieldErrors.originLabel)}
                    aria-describedby="origin-help"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmOriginSelection}
                    className="min-h-12 rounded-2xl border border-[rgba(17,17,17,0.12)] bg-white px-4 text-sm font-semibold whitespace-nowrap text-[var(--foreground)] shadow-[0_10px_24px_rgba(17,17,17,0.06)]"
                  >
                    선택
                  </button>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating || isSubmitting}
                    className="min-h-12 rounded-2xl border border-[rgba(17,17,17,0.12)] bg-[var(--accent)] px-4 text-sm font-semibold whitespace-nowrap text-[var(--foreground)] shadow-[0_14px_28px_rgba(211,166,63,0.22)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {isLocating ? "위치 확인 중..." : "현재 위치"}
                  </button>
                </div>
              </div>

              <p
                id="origin-help"
                className={`min-h-6 text-sm leading-6 text-[var(--muted)] ${
                  locationStatus ? "opacity-100" : "opacity-0"
                }`}
              >
                {locationStatus || " "}
              </p>
              {fieldErrors.originLabel ? (
                <p className="text-sm font-medium text-[var(--accent-red)]">
                  {fieldErrors.originLabel}
                </p>
              ) : null}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-[var(--foreground)]">
                  민원 목적
                </label>
              </div>

              <button
                type="button"
                onClick={openPurposePicker}
                className={`w-full rounded-[28px] border px-4 py-5 text-left shadow-[0_20px_42px_rgba(17,17,17,0.06)] transition-all duration-200 hover:-translate-y-0.5 ${
                  selectedPurpose
                    ? "border-[rgba(211,166,63,0.55)] bg-[linear-gradient(180deg,rgba(244,238,223,0.98)_0%,rgba(255,253,248,1)_100%)]"
                    : "border-[rgba(17,17,17,0.08)] bg-white"
                }`}
                aria-haspopup="dialog"
                aria-expanded={isPurposePickerOpen}
                aria-controls={purposeDialogId}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                      {selectedPurpose?.label ?? "민원 목적을 선택해 주세요"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {selectedPurpose?.description ??
                        ""}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-[rgba(17,17,17,0.08)] bg-white text-lg shadow-[0_12px_24px_rgba(17,17,17,0.06)]">
                    →
                  </div>
                </div>
              </button>

              {fieldErrors.purposeId ? (
                <p className="text-sm font-medium text-[var(--accent-red)]">
                  {fieldErrors.purposeId}
                </p>
              ) : null}
            </section>

            {requestError ? (
              <div className="rounded-[20px] border border-[rgba(220,38,38,0.18)] bg-[rgba(220,38,38,0.06)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                {requestError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLocating || isSubmitting}
              className="min-h-14 w-full rounded-[22px] border border-[var(--foreground)] bg-[var(--foreground)] px-5 text-base font-semibold text-white shadow-[0_20px_44px_rgba(17,17,17,0.16)] hover:-translate-y-0.5 hover:border-[var(--accent-blue)] hover:bg-[var(--accent-blue)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              추천 요청
            </button>
          </form>
        </section>
      </div>

      {isPurposePickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-[rgba(17,17,17,0.45)] px-4 pb-4 pt-10 backdrop-blur-[6px] sm:items-center sm:justify-center sm:px-6"
          onClick={() => setIsPurposePickerOpen(false)}
        >
          <div
            id={purposeDialogId}
            role="dialog"
            aria-modal="true"
            aria-label="민원 목적 선택"
            className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.22)] bg-[linear-gradient(180deg,rgba(255,251,237,0.98)_0%,rgba(255,255,255,1)_100%)] shadow-[0_30px_80px_rgba(17,17,17,0.26)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[rgba(17,17,17,0.08)] px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                    민원 목적을 선택해 주세요
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPurposePickerOpen(false)}
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-[rgba(17,17,17,0.08)] bg-white text-lg shadow-[0_12px_24px_rgba(17,17,17,0.08)]"
                  aria-label="민원 목적 선택 닫기"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="max-h-[72dvh] overflow-auto px-5 py-5 sm:px-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {purposeOptions.map((purpose) => (
                  <PurposeOptionCard
                    key={purpose.id}
                    label={purpose.label}
                    description={purpose.description}
                    selected={draftPurposeId === purpose.id}
                    onClick={() => setDraftPurposeId(purpose.id)}
                  />
                ))}
              </div>

              <div className="mt-5 flex flex-col-reverse gap-3 border-t border-[rgba(17,17,17,0.08)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--muted)]">
                  {draftPurpose
                    ? `선택 예정: ${draftPurpose.label}`
                    : ""}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPurposePickerOpen(false)}
                    className="min-h-11 rounded-2xl border border-[rgba(17,17,17,0.1)] bg-white px-4 text-sm font-semibold text-[var(--foreground)]"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPurposeId(draftPurposeId);
                      setFieldErrors((current) => ({
                        ...current,
                        purposeId: undefined,
                      }));
                      setIsPurposePickerOpen(false);
                    }}
                    disabled={!draftPurposeId}
                    className="min-h-11 rounded-2xl border border-[var(--foreground)] bg-[var(--foreground)] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(17,17,17,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
