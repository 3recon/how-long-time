"use client";

import { type FormEvent, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Eyebrow,
  PurposeOptionCard,
  formatCoordinates,
} from "@/components/recommend/recommend-ui";
import { appConfig } from "@/lib/env";
import {
  buildDemoRecommendRequest,
  validateRecommendForm,
} from "@/lib/recommend/form";
import { buildRecommendResultsHref } from "@/lib/recommend/route-state";
import type { LocationPoint, RecommendPurposeId } from "@/types/recommend";
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
  const [locationStatus, setLocationStatus] = useState(
    "demo 모드에서는 서울시청 기준 좌표로 같은 결과를 재현합니다.",
  );
  const [isLocating, setIsLocating] = useState(false);
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

  async function handleUseCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setRequestError("브라우저에서 현재 위치 기능을 지원하지 않습니다.");
      return;
    }

    setIsLocating(true);
    setRequestError(null);
    setLocationStatus("현재 위치를 확인하고 있습니다.");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCoordinates(nextCoordinates);
        setOriginLabel((current) => current.trim() || "현재 위치");
        setFieldErrors((current) => ({ ...current, originLabel: undefined }));
        setLocationStatus(
          "현재 위치를 반영했습니다. 추천 요청을 누르면 같은 탭에서 결과 화면으로 이동합니다.",
        );
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    const requestPayload = buildDemoRecommendRequest({
      originLabel,
      purposeId: purposeId as RecommendPurposeId,
      coordinates,
      fallbackOrigin: appConfig.defaultCenter,
    });

    router.push(buildRecommendResultsHref(requestPayload));
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(211,166,63,0.24),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(31,58,95,0.08),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[900px] items-center px-4 py-6 sm:px-6 lg:px-8">
        <section className="soft-card w-full rounded-[36px] border-[rgba(17,17,17,0.08)] p-5 sm:p-7">
          <div className="border-b border-[var(--line)] pb-6">
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow>Minwon Now</Eyebrow>
              <span className="rounded-full border border-[rgba(17,17,17,0.08)] bg-white px-3 py-1 text-xs font-medium text-[var(--muted)]">
                1단계 입력 화면
              </span>
            </div>

            <h1 className="mt-5 text-5xl font-semibold leading-[0.94] tracking-[-0.08em] text-balance sm:text-[4.4rem]">
              위치와 민원 목적만 고르면
              <span className="block text-[var(--accent-strong)]">
                다음 화면에서 비교합니다.
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              첫 화면에서는 입력만 간결하게 끝내고, 결과 화면에서 위치 비교 보기와
              경로, 추천 결과 비교를 한 번에 확인합니다.
            </p>
          </div>

          <form className="space-y-6 pt-6" onSubmit={handleSubmit}>
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="originLabel"
                  className="text-sm font-semibold text-[var(--foreground)]"
                >
                  출발지
                </label>
                <span className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  origin
                </span>
              </div>

              <div className="rounded-[28px] border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_20px_44px_rgba(17,17,17,0.06)] sm:p-5">
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
                  placeholder="예) 서울시청, 집, 회사"
                  className="min-h-12 w-full border-b border-[rgba(17,17,17,0.12)] bg-transparent px-0 pb-3 text-base outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent-blue)]"
                  aria-invalid={Boolean(fieldErrors.originLabel)}
                  aria-describedby="origin-help"
                />

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="min-h-12 rounded-2xl border border-[rgba(17,17,17,0.12)] bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--foreground)] shadow-[0_14px_28px_rgba(211,166,63,0.22)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {isLocating ? "위치 확인 중..." : "현재 위치 사용"}
                  </button>
                  <div className="flex-1 rounded-2xl border border-dashed border-[rgba(17,17,17,0.12)] px-4 py-3 text-sm text-[var(--muted)]">
                    기준 좌표: {formatCoordinates(coordinates)}
                  </div>
                </div>
              </div>

              <p id="origin-help" className="text-sm leading-6 text-[var(--muted)]">
                {locationStatus}
              </p>
              {fieldErrors.originLabel ? (
                <p className="text-sm font-medium text-[var(--accent-red)]">
                  {fieldErrors.originLabel}
                </p>
              ) : null}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-[var(--foreground)]">
                  민원 목적
                </label>
                <span className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  purpose
                </span>
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
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                      Purpose Picker
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                      {selectedPurpose?.label ?? "민원 목적을 선택해 주세요"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {selectedPurpose?.description ??
                        "목적을 먼저 고르면 결과 화면에서 비교 이유가 더 선명해집니다."}
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
              disabled={isLocating}
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
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                    Purpose Picker
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                    민원 목적을 빠르게 선택해 주세요
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    목적을 고르면 결과 화면에서도 같은 기준으로 비교합니다.
                  </p>
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
                    : "목적을 하나 고르면 확인 버튼이 활성화됩니다."}
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
