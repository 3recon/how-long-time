"use client";

import { useState, type FormEvent } from "react";

import { appConfig } from "@/lib/env";
import {
  buildDemoRecommendRequest,
  validateRecommendForm,
} from "@/lib/recommend/form";
import type {
  LocationPoint,
  RecommendErrorResponse,
  RecommendPurposeId,
  RecommendResponse,
} from "@/types/recommend";

const purposeOptions: Array<{
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

function formatCoordinates(point: LocationPoint | null): string {
  if (!point) {
    return "좌표 없음";
  }

  return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
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

export default function Home() {
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
  const [locationStatus, setLocationStatus] = useState(
    "demo 모드에서는 서울시청 기본 좌표로 동일한 결과를 재현할 수 있습니다.",
  );
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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

    if (Object.keys(nextErrors).length > 0) {
      setResult(null);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          buildDemoRecommendRequest({
            originLabel,
            purposeId: purposeId as RecommendPurposeId,
            coordinates,
            fallbackOrigin: appConfig.defaultCenter,
          }),
        ),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | RecommendErrorResponse
          | null;

        setResult(null);
        setRequestError(getRequestErrorMessage(errorBody));
        return;
      }

      const responseBody = (await response.json()) as RecommendResponse;
      setResult(responseBody);
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
    <main className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40" aria-hidden />
      <div
        className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[rgba(255,212,0,0.22)] via-[rgba(255,255,255,0.92)] to-transparent"
        aria-hidden
      />

      <section className="relative mx-auto flex min-h-dvh w-full max-w-[1820px] flex-col px-4 py-5 sm:px-6 lg:h-screen lg:max-h-screen lg:px-8 lg:py-4 xl:px-12">
        <header className="grid gap-4 border-b border-[var(--line)] pb-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(25rem,0.6fr)] lg:items-end lg:gap-10 lg:pb-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-[var(--accent-strong)]">
              Minwon Now
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-none tracking-[-0.05em] text-balance sm:text-4xl lg:text-[3.3rem]">
              민원나우
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] [text-wrap:pretty] lg:text-[0.98rem]">
              대기 인원과 이동시간을 함께 비교해 지금 방문하기 더 나은 민원실을
              빠르게 찾습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-self-start lg:justify-self-end">
            <span className="border border-[var(--foreground)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] shadow-[4px_4px_0_rgba(17,17,17,0.12)]">
              현재 모드: demo
            </span>
            <span className="border border-[var(--accent-blue)] bg-white px-4 py-2 text-sm font-medium text-[var(--accent-blue)] shadow-[4px_4px_0_rgba(29,78,216,0.08)]">
              API 프록시: /api/recommend
            </span>
          </div>
        </header>

        <form
          className="grid gap-6 pt-5 lg:h-full lg:flex-1 lg:grid-cols-12 lg:grid-rows-[auto_auto_1fr_auto] lg:gap-x-10 lg:gap-y-5"
          onSubmit={handleSubmit}
        >
          <section className="space-y-4 border-b border-[var(--line)] pb-5 lg:col-span-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--accent-strong)]">
                Input Flow
              </p>
              <h2 className="max-w-2xl text-3xl font-semibold leading-[1.04] tracking-[-0.05em] text-balance lg:text-[2.85rem]">
                출발지와 민원 목적을 고르면
                <span className="block text-[var(--accent-strong)]">
                  추천 요청까지 한 화면에서 끝납니다.
                </span>
              </h2>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="originLabel"
                  className="text-sm font-semibold text-[var(--foreground)]"
                >
                  출발지
                </label>
                <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                  origin
                </span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:items-end lg:gap-3">
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
                  className="min-h-12 flex-1 border-b-2 border-[var(--foreground)] bg-transparent px-0 pb-2.5 text-base outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent-blue)]"
                  aria-invalid={Boolean(fieldErrors.originLabel)}
                  aria-describedby="origin-help"
                />
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating || isSubmitting}
                  className="min-h-12 border border-[var(--foreground)] bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--foreground)] shadow-[4px_4px_0_rgba(17,17,17,0.12)] hover:-translate-y-px hover:shadow-[6px_6px_0_rgba(17,17,17,0.12)] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isLocating ? "위치 확인 중.." : "현재 위치 사용"}
                </button>
              </div>
              <p
                id="origin-help"
                className="text-sm leading-5 text-[var(--muted)] lg:text-[0.9rem]"
              >
                {locationStatus}
              </p>
              {fieldErrors.originLabel ? (
                <p className="text-sm font-medium text-[var(--accent-red)]">
                  {fieldErrors.originLabel}
                </p>
              ) : null}
            </div>
          </section>

          <aside className="space-y-3 border-b border-[var(--line)] pb-5 lg:col-span-3 lg:row-span-2 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
            <div className="space-y-1.5 border-b border-[var(--line)] pb-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                Request Notes
              </p>
              <p className="text-sm leading-5 text-[var(--muted)] lg:text-[0.88rem]">
                입력 후 `/api/recommend`로 demo POST 요청을 보내고, 프록시가 추천
                백엔드와 연결해 결과를 가져옵니다.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                상태
              </p>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-[var(--muted)]">전송 모드</dt>
                  <dd className="mt-1 font-semibold tabular-nums">demo</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">기준 좌표</dt>
                  <dd className="mt-1 font-semibold tabular-nums">
                    {formatCoordinates(coordinates)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">백엔드 후보</dt>
                  <dd className="mt-1 break-all font-semibold leading-5 lg:text-[0.84rem]">
                    {appConfig.apiBaseUrl}
                  </dd>
                </div>
              </dl>
            </div>

            {requestError ? (
              <div className="border-l-4 border-[var(--accent-red)] bg-[rgba(220,38,38,0.06)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                {requestError}
              </div>
            ) : null}

            <div className="border-t border-dashed border-[var(--line)] pt-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                demo mode
              </p>
              <p className="mt-2 text-sm leading-5 text-[var(--muted)] lg:text-[0.84rem]">
                현재는 심사 재현성을 우선합니다. 추천 요청은 구현되어 있고,
                결과는 demo 응답이 돌아오면 즉시 오른쪽 영역에 반영됩니다.
              </p>
            </div>
          </aside>

          <section className="space-y-3 border-b border-[var(--line)] pb-5 lg:col-span-4 lg:row-span-4 lg:border-b-0 lg:pb-0 lg:pl-2">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                  Recommendation
                </p>
                <p className="mt-1 max-w-sm text-sm text-[var(--muted)] lg:text-[0.88rem]">
                  추천 결과와 비교 포인트를 화면 오른쪽에 모아 보여줍니다.
                </p>
              </div>
              {result ? (
                <span className="text-sm font-semibold tabular-nums">
                  {result.summary.returnedRecommendationCount}개
                </span>
              ) : null}
            </div>

            {result ? (
              <div className="grid gap-4">
                {result.recommendations.slice(0, 2).map((office) => (
                  <article
                    key={office.id}
                    className="space-y-2 border-t-2 border-[rgba(17,17,17,0.12)] pt-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                          추천 {office.recommendation.rank}
                        </p>
                        <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.03em] lg:text-[1.08rem]">
                          {office.name}
                        </h3>
                      </div>
                      <span className="border border-[var(--foreground)] bg-[var(--accent)] px-2 py-1 text-sm font-semibold tabular-nums shadow-[3px_3px_0_rgba(17,17,17,0.1)]">
                        {office.recommendation.score}점
                      </span>
                    </div>

                    <p className="text-sm leading-5 text-[var(--muted)] lg:text-[0.84rem]">
                      {office.address}
                    </p>
                    <p className="text-sm leading-5 text-[var(--foreground)] lg:text-[0.84rem]">
                      {office.recommendation.reason}
                    </p>

                    <dl className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1 lg:text-[0.82rem]">
                      <div>
                        <dt className="text-[var(--muted)]">대기 인원</dt>
                        <dd className="mt-1 font-semibold tabular-nums">
                          {office.waiting.count}명
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">이동시간</dt>
                        <dd className="mt-1 font-semibold tabular-nums">
                          {office.travel.minutes}분
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">처리 업무</dt>
                        <dd className="mt-1 leading-5 font-semibold">
                          {office.supportedTaskMatches
                            .map((task) => task.taskName)
                            .join(", ")}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <div className="border-t-2 border-dashed border-[rgba(17,17,17,0.18)] pt-4 text-sm leading-6 text-[var(--muted)] lg:text-[0.9rem]">
                아직 추천 결과가 없습니다. 출발지와 민원 목적을 입력하고 demo
                추천을 요청해 보세요.
              </div>
            )}
          </section>

          <section className="space-y-3 border-b border-[var(--line)] pb-5 lg:col-span-8 lg:border-b-0 lg:border-t lg:pt-5">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-[var(--foreground)]">
                민원 목적
              </label>
              <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                5 options
              </span>
            </div>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              {purposeOptions.map((purpose) => {
                const selected = purposeId === purpose.id;

                return (
                  <button
                    key={purpose.id}
                    type="button"
                    onClick={() => {
                      setPurposeId(purpose.id);
                      if (fieldErrors.purposeId) {
                        setFieldErrors((current) => ({
                          ...current,
                          purposeId: undefined,
                        }));
                      }
                    }}
                    className={`border-b-2 pb-3 text-left transition-transform transition-colors duration-200 ${
                      selected
                        ? "border-[var(--accent-blue)]"
                        : "border-[rgba(17,17,17,0.14)] hover:-translate-y-px hover:border-[var(--foreground)]"
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[1rem] font-semibold leading-5 tracking-[-0.03em]">
                          {purpose.label}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                          {purpose.description}
                        </p>
                      </div>
                      <span
                        className={`mt-1 h-3 w-3 rounded-full border ${
                          selected
                            ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]"
                            : "border-[rgba(17,17,17,0.25)]"
                        }`}
                        aria-hidden
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            {fieldErrors.purposeId ? (
              <p className="text-sm font-medium text-[var(--accent-red)]">
                {fieldErrors.purposeId}
              </p>
            ) : null}
          </section>

          <div className="lg:col-span-8 lg:border-t lg:border-[var(--line)] lg:pt-5">
            <button
              type="submit"
              disabled={isSubmitting || isLocating}
              className="min-h-12 w-full border border-[var(--foreground)] bg-[var(--foreground)] px-5 text-base font-semibold text-white shadow-[6px_6px_0_rgba(17,17,17,0.14)] hover:-translate-y-px hover:border-[var(--accent-blue)] hover:bg-[var(--accent-blue)] hover:shadow-[8px_8px_0_rgba(29,78,216,0.12)] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isSubmitting ? "추천 요청 중.." : "추천 요청"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
