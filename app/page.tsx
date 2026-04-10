"use client";

import {
  useEffect,
  useId,
  useState,
  type FormEvent,
} from "react";

import { KakaoMapPanel } from "@/components/recommend/kakao-map-panel";
import {
  getPurposeLabel,
  purposeOptions,
} from "@/data/recommend/purpose-options";
import { appConfig } from "@/lib/env";
import { createClientDemoRecommendResponse } from "@/lib/recommend/client-demo";
import {
  buildDemoRecommendRequest,
  validateRecommendForm,
} from "@/lib/recommend/form";
import {
  getInitialSelectedOfficeId,
  resolveSelectedOffice,
} from "@/lib/recommend/presentation";
import type {
  LocationPoint,
  RecommendErrorResponse,
  RecommendPurposeId,
  RecommendResponse,
  RecommendedOffice,
} from "@/types/recommend";

function formatCoordinates(point: LocationPoint | null): string {
  if (!point) {
    return "좌표 없음";
  }

  return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
}

function formatUpdatedAt(value: string | null): string {
  if (!value) {
    return "방금 수집";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "방금 수집";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getRequestErrorMessage(errorBody: RecommendErrorResponse | null): string {
  switch (errorBody?.error) {
    case "INVALID_REQUEST":
      return "입력값을 다시 확인해 주세요.";
    case "INVALID_JSON":
      return "요청 형식이 올바르지 않습니다.";
    case "UPSTREAM_CONFIG_ERROR":
      return "추천 서버 설정을 확인해 주세요.";
    case "UPSTREAM_API_ERROR":
      return "추천 서버와 연결하지 못했습니다.";
    default:
      return "추천 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
}

function StatChip(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(17,17,17,0.08)] bg-white px-4 py-3 shadow-[0_16px_34px_rgba(17,17,17,0.06)]">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
        {props.label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-[-0.03em]">
        {props.value}
      </p>
    </div>
  );
}

function PurposeOptionCard(props: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  const { label, description, selected, onClick } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-[24px] border px-4 py-4 text-left transition-all duration-200 ${
        selected
          ? "border-[var(--accent-blue)] bg-[linear-gradient(180deg,rgba(244,238,223,0.98)_0%,rgba(255,253,248,1)_100%)] shadow-[0_24px_48px_rgba(31,58,95,0.12)]"
          : "border-[rgba(17,17,17,0.08)] bg-white/94 hover:-translate-y-0.5 hover:border-[rgba(17,17,17,0.16)] hover:shadow-[0_18px_32px_rgba(17,17,17,0.08)]"
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold tracking-[-0.03em]">{label}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        </div>
        <span
          className={`mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full border transition-colors ${
            selected
              ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white"
              : "border-[rgba(17,17,17,0.18)] bg-white text-transparent group-hover:border-[rgba(17,17,17,0.28)]"
          }`}
          aria-hidden
        >
          ●
        </span>
      </div>
    </button>
  );
}

function RecommendationCard(props: {
  office: RecommendedOffice;
  selected: boolean;
  onSelect: () => void;
}) {
  const { office, selected, onSelect } = props;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[24px] border px-5 py-4 text-left transition-all duration-200 ${
        selected
          ? "border-[var(--accent-blue)] bg-[linear-gradient(180deg,rgba(244,238,223,0.95)_0%,rgba(255,253,248,1)_100%)] shadow-[0_24px_48px_rgba(31,58,95,0.12)]"
          : "border-[rgba(17,17,17,0.08)] bg-white hover:-translate-y-0.5 hover:border-[rgba(17,17,17,0.16)] hover:shadow-[0_20px_40px_rgba(17,17,17,0.08)]"
      }`}
      aria-pressed={selected}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[rgba(17,17,17,0.08)] bg-[rgba(211,166,63,0.18)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">
              #{office.recommendation.rank}
            </span>
            {selected ? (
              <span className="rounded-full bg-[var(--accent-blue)] px-2.5 py-1 text-xs font-semibold text-white">
                선택 중
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em]">
            {office.name}
          </h3>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {office.address}
          </p>
        </div>

        <div className="rounded-2xl border border-[rgba(17,17,17,0.08)] bg-white px-3 py-2 text-right shadow-[0_12px_24px_rgba(17,17,17,0.06)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            score
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {office.recommendation.score}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--foreground)]">
        {office.recommendation.reason}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatChip label="이동시간" value={`${office.travel.minutes}분`} />
        <StatChip label="대기 인원" value={`${office.waiting.count}명`} />
        <StatChip
          label="업무"
          value={office.supportedTaskMatches
            .map((task) => task.taskName)
            .join(", ")}
        />
      </div>
    </button>
  );
}

export default function Home() {
  const purposeDialogId = useId();
  const [originLabel, setOriginLabel] = useState("");
  const [purposeId, setPurposeId] = useState("");
  const [coordinates, setCoordinates] = useState<LocationPoint | null>(
    appConfig.defaultCenter,
  );
  const [fieldErrors, setFieldErrors] = useState<{
    originLabel?: string;
    purposeId?: string;
  }>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestNotice, setRequestNotice] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState(
    "demo 모드에서는 서울시청 기본 좌표로 동일한 결과를 재현할 수 있습니다.",
  );
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isPurposePickerOpen, setIsPurposePickerOpen] = useState(false);
  const [draftPurposeId, setDraftPurposeId] = useState("");

  useEffect(() => {
    setSelectedOfficeId(getInitialSelectedOfficeId(result));
  }, [result]);

  useEffect(() => {
    if (!isPurposePickerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closePurposePicker();
      }
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isPurposePickerOpen]);

  const selectedOffice = result
    ? resolveSelectedOffice(result.recommendations, selectedOfficeId)
    : null;
  const selectedPurpose =
    purposeOptions.find((purpose) => purpose.id === purposeId) ?? null;
  const draftPurpose =
    purposeOptions.find((purpose) => purpose.id === draftPurposeId) ?? null;

  function openPurposePicker() {
    setDraftPurposeId(purposeId);
    setIsPurposePickerOpen(true);
  }

  function closePurposePicker() {
    setIsPurposePickerOpen(false);
  }

  function applySelectedPurpose() {
    setPurposeId(draftPurposeId);
    setFieldErrors((current) => ({
      ...current,
      purposeId: undefined,
    }));
    closePurposePicker();
  }

  async function handleUseCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setRequestError("이 브라우저에서는 현재 위치 기능을 사용할 수 없습니다.");
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
        setLocationStatus("현재 위치를 반영했습니다. 추천 요청을 진행해 보세요.");
        setIsLocating(false);
      },
      () => {
        setRequestError(
          "현재 위치를 가져오지 못했습니다. 출발지를 직접 입력해 주세요.",
        );
        setLocationStatus(
          "위치 권한이 없어도 서울시청 기준 demo 추천 결과를 확인할 수 있습니다.",
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateRecommendForm({
      originLabel,
      purposeId,
    });

    setFieldErrors(nextErrors);
    setRequestError(null);
    setRequestNotice(null);

    if (Object.keys(nextErrors).length > 0) {
      setResult(null);
      return;
    }

    setIsSubmitting(true);

    try {
      const requestPayload = buildDemoRecommendRequest({
        originLabel,
        purposeId: purposeId as RecommendPurposeId,
        coordinates,
        fallbackOrigin: appConfig.defaultCenter,
      });

      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | RecommendErrorResponse
          | null;

        if (requestPayload.mode === "demo") {
          const fallbackResponse = createClientDemoRecommendResponse(requestPayload);

          setResult(fallbackResponse);
          setRequestNotice(
            "추천 백엔드 연결이 불안정해 로컬 demo 샘플 결과로 계속 진행합니다.",
          );
          setLocationStatus("로컬 demo 샘플 결과를 불러왔습니다.");
          return;
        }

        setResult(null);
        setRequestError(getRequestErrorMessage(errorBody));
        return;
      }

      const responseBody = (await response.json()) as RecommendResponse;
      setResult(responseBody);
      setRequestNotice(null);
      setLocationStatus(
        responseBody.request.originLabel === "현재 위치"
          ? "현재 위치 기준 demo 추천 결과를 불러왔습니다."
          : "입력한 출발지 기준 demo 추천 결과를 불러왔습니다.",
      );
    } catch {
      setResult(null);
      setRequestError("추천 요청 중 네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden lg:h-dvh">
      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:grid lg:h-dvh lg:grid-cols-[minmax(0,390px)_minmax(0,1fr)] lg:gap-5 lg:overflow-hidden lg:px-6 lg:py-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section className="soft-card rounded-[32px] border-[rgba(17,17,17,0.08)] p-5 sm:p-6 lg:flex lg:h-[calc(100dvh-2rem)] lg:min-h-0 lg:flex-col lg:overflow-hidden lg:p-5">
          <div className="space-y-3 border-b border-[var(--line)] pb-4 lg:space-y-2 lg:pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--foreground)]">
                Minwon Now
              </span>
              <span className="rounded-full border border-[rgba(17,17,17,0.08)] bg-white px-3 py-1 text-xs font-medium text-[var(--muted)]">
                현재 모드: demo
              </span>
            </div>

            <div className="space-y-2 lg:space-y-1.5">
              <h1 className="text-4xl font-semibold leading-[0.96] tracking-[-0.06em] text-balance sm:text-[3.15rem] lg:text-[2.45rem]">
                대기 인원과 이동시간을
                <span className="block text-[var(--accent-strong)]">
                  한 번에 비교합니다.
                </span>
              </h1>
              <p className="max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-[0.95rem] lg:text-[0.88rem] lg:leading-5">
                출발지와 민원 목적을 입력하면 방문 후보를 리스트와 지도에 함께
                보여줍니다. 카드 선택과 지도 포커스가 같은 흐름으로 연결됩니다.
              </p>
            </div>
          </div>

          <form
            className="space-y-4 pt-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:space-y-3 lg:pt-4"
            onSubmit={handleSubmit}
          >
            <section className="space-y-3 lg:space-y-2">
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

              <div className="rounded-[24px] border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.88)] p-4 shadow-[0_18px_40px_rgba(17,17,17,0.06)] lg:p-3.5">
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
                  placeholder="예: 서울시청, 집, 회사"
                  className="min-h-12 w-full border-b border-[rgba(17,17,17,0.12)] bg-transparent px-0 pb-3 text-base outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent-blue)]"
                  aria-invalid={Boolean(fieldErrors.originLabel)}
                  aria-describedby="origin-help"
                />

                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating || isSubmitting}
                    className="min-h-12 rounded-2xl border border-[rgba(17,17,17,0.12)] bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--foreground)] shadow-[0_14px_28px_rgba(211,166,63,0.22)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {isLocating ? "위치 확인 중.." : "현재 위치 사용"}
                  </button>
                  <div className="flex-1 rounded-2xl border border-dashed border-[rgba(17,17,17,0.12)] px-4 py-3 text-sm text-[var(--muted)]">
                    기준 좌표: {formatCoordinates(coordinates)}
                  </div>
                </div>
              </div>

              <p id="origin-help" className="text-sm leading-6 text-[var(--muted)] lg:text-[0.85rem] lg:leading-5">
                {locationStatus}
              </p>
              {fieldErrors.originLabel ? (
                <p className="text-sm font-medium text-[var(--accent-red)]">
                  {fieldErrors.originLabel}
                </p>
              ) : null}
            </section>

            <section className="space-y-3 lg:space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-[var(--foreground)]">
                  민원 목적
                </label>
                <span className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  quick picker
                </span>
              </div>

              <button
                type="button"
                onClick={openPurposePicker}
                className={`w-full rounded-[26px] border px-4 py-4 text-left shadow-[0_18px_38px_rgba(17,17,17,0.06)] transition-all duration-200 hover:-translate-y-0.5 ${
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
                    <p className="mt-2 text-base font-semibold tracking-[-0.03em]">
                      {selectedPurpose?.label ?? "민원 목적을 선택하세요"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {selectedPurpose?.description ??
                        "목적을 팝업에서 고르면 입력 영역 높이를 줄이고, 결과 화면을 더 안정적으로 유지합니다."}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-[rgba(17,17,17,0.08)] bg-white text-lg shadow-[0_12px_24px_rgba(17,17,17,0.06)]">
                    ▾
                  </div>
                </div>
              </button>

              {fieldErrors.purposeId ? (
                <p className="text-sm font-medium text-[var(--accent-red)]">
                  {fieldErrors.purposeId}
                </p>
              ) : null}
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:gap-2">
              <div className="rounded-[22px] border border-[rgba(17,17,17,0.08)] bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  API 프록시
                </p>
                <p className="mt-2 break-all text-sm font-semibold leading-6">
                  /api/recommend
                </p>
              </div>
              <div className="rounded-[22px] border border-[rgba(17,17,17,0.08)] bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  백엔드 후보
                </p>
                <p className="mt-2 break-all text-sm font-semibold leading-6">
                  {appConfig.apiBaseUrl}
                </p>
              </div>
            </section>

            {requestError ? (
              <div className="rounded-[20px] border border-[rgba(220,38,38,0.18)] bg-[rgba(220,38,38,0.06)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                {requestError}
              </div>
            ) : null}

            {requestNotice ? (
              <div className="rounded-[20px] border border-[rgba(211,166,63,0.24)] bg-[rgba(211,166,63,0.12)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                {requestNotice}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || isLocating}
              className="min-h-13 w-full rounded-[22px] border border-[var(--foreground)] bg-[var(--foreground)] px-5 text-base font-semibold text-white shadow-[0_20px_44px_rgba(17,17,17,0.16)] hover:-translate-y-0.5 hover:border-[var(--accent-blue)] hover:bg-[var(--accent-blue)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 lg:mt-auto"
            >
              {isSubmitting ? "추천 요청 중.." : "추천 결과와 지도 보기"}
            </button>
          </form>
        </section>

        <section className="flex min-w-0 flex-col gap-5 lg:h-[calc(100dvh-2rem)] lg:min-h-0 lg:overflow-hidden">
          <header className="soft-card rounded-[32px] border-[rgba(17,17,17,0.08)] p-5 sm:p-6 lg:flex-none lg:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                  Recommendation Board
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-[2.4rem] lg:text-[2rem]">
                  결과 리스트와 지도 포커스를
                  <span className="block">같은 화면에서 확인합니다.</span>
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px] lg:gap-2">
                <StatChip
                  label="선택 목적"
                  value={purposeId ? getPurposeLabel(purposeId) : "선택 대기"}
                />
                <StatChip
                  label="추천 수"
                  value={
                    result
                      ? `${result.summary.returnedRecommendationCount}개`
                      : "0개"
                  }
                />
                <StatChip
                  label="포커스"
                  value={selectedOffice ? `#${selectedOffice.recommendation.rank}` : "없음"}
                />
              </div>
            </div>
          </header>

          <div className="grid min-w-0 gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] lg:overflow-hidden xl:grid-cols-[minmax(0,1.14fr)_minmax(340px,0.86fr)]">
            <KakaoMapPanel
              appKey={appConfig.kakaoMapAppKey}
              origin={result?.request.origin ?? coordinates ?? appConfig.defaultCenter}
              originLabel={result?.request.originLabel || originLabel || "출발지"}
              recommendations={result?.recommendations ?? []}
              selectedOfficeId={selectedOfficeId}
              onSelectOffice={setSelectedOfficeId}
            />

            <section className="soft-card min-w-0 rounded-[28px] border-[rgba(17,17,17,0.08)] p-5 sm:p-6 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden lg:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                    Result List
                  </p>
                  <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
                    추천 결과 비교
                  </h3>
                </div>
                {selectedOffice ? (
                  <div className="rounded-2xl border border-[rgba(17,17,17,0.08)] bg-[rgba(211,166,63,0.12)] px-4 py-2 text-sm font-medium">
                    최근 대기 정보 {formatUpdatedAt(selectedOffice.waiting.updatedAt)}
                  </div>
                ) : null}
              </div>

              {selectedOffice ? (
                <div className="mt-5 rounded-[24px] border border-[rgba(17,17,17,0.08)] bg-[linear-gradient(180deg,rgba(244,238,223,0.95)_0%,rgba(255,253,248,1)_100%)] p-5 shadow-[0_22px_46px_rgba(17,17,17,0.06)] lg:mt-4 lg:p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                        현재 선택한 민원실
                      </p>
                      <h4 className="mt-2 text-2xl font-semibold tracking-[-0.04em] lg:text-[1.55rem]">
                        {selectedOffice.name}
                      </h4>
                    </div>
                    <div className="rounded-2xl border border-[rgba(17,17,17,0.08)] bg-white px-4 py-3 text-right shadow-[0_14px_28px_rgba(17,17,17,0.06)]">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        score
                      </p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums">
                        {selectedOffice.recommendation.score}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {selectedOffice.address}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-[var(--foreground)]">
                    {selectedOffice.recommendation.reason}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:mt-4 lg:gap-2">
                    <StatChip
                      label="이동시간"
                      value={`${selectedOffice.travel.minutes}분`}
                    />
                    <StatChip
                      label="대기 인원"
                      value={`${selectedOffice.waiting.count}명`}
                    />
                    <StatChip
                      label="처리 업무"
                      value={selectedOffice.supportedTaskMatches
                        .map((task) => task.taskName)
                        .join(", ")}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] border border-dashed border-[rgba(17,17,17,0.16)] px-5 py-8 text-center text-sm leading-6 text-[var(--muted)]">
                  아직 추천 결과가 없습니다. 왼쪽 입력 영역에서 demo 추천을 요청하면
                  결과 카드와 Kakao 지도 포커스가 함께 활성화됩니다.
                </div>
              )}

              <div className="mt-5 space-y-4 lg:mt-4 lg:min-h-0 lg:flex-1 lg:space-y-3 lg:overflow-auto lg:pr-1">
                {(result?.recommendations ?? []).map((office) => (
                  <RecommendationCard
                    key={office.id}
                    office={office}
                    selected={selectedOffice?.id === office.id}
                    onSelect={() => setSelectedOfficeId(office.id)}
                  />
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>

      {isPurposePickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-[rgba(17,17,17,0.45)] px-4 pb-4 pt-10 backdrop-blur-[6px] sm:items-center sm:justify-center sm:px-6"
          onClick={closePurposePicker}
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
                    민원 목적을 빠르게 선택하세요
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    옵션을 먼저 둘러본 뒤 확인 버튼으로 적용할 수 있습니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePurposePicker}
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-[rgba(17,17,17,0.08)] bg-white text-lg shadow-[0_12px_24px_rgba(17,17,17,0.08)]"
                  aria-label="민원 목적 선택 닫기"
                >
                  ✕
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
                    : "목적을 하나 선택한 뒤 확인을 누르세요."}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closePurposePicker}
                    className="min-h-11 rounded-2xl border border-[rgba(17,17,17,0.1)] bg-white px-4 text-sm font-semibold text-[var(--foreground)]"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={applySelectedPurpose}
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
