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
      return "추천 서버에 연결하지 못했습니다.";
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
  const [locationStatus, setLocationStatus] = useState<string>(
    "demo 모드에서는 기본 좌표로 서울시청 기준 추천을 확인할 수 있습니다.",
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
        setRequestError("현재 위치를 가져오지 못했습니다. 출발지를 직접 입력해 주세요.");
        setLocationStatus(
          "위치 권한이 없으면 서울시청 기준 demo 추천으로도 확인할 수 있습니다.",
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
      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-[var(--line)] bg-white/75 px-5 py-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent-strong)]">
              Minwon Now
            </p>
            <h1 className="text-2xl font-semibold sm:text-3xl">{appConfig.appName}</h1>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              대기 인원과 이동시간을 한 화면에서 비교해, 지금 방문하기 더 나은 민원실을
              빠르게 찾습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-[var(--surface-strong)] px-4 py-2 font-semibold text-[var(--foreground)]">
              현재 모드: demo
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-[var(--muted)]">
              API 프록시: /api/recommend
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="soft-card relative overflow-hidden rounded-[2rem] px-6 py-7 sm:px-8 sm:py-8">
            <div
              className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-[rgba(255,208,64,0.22)] blur-3xl"
              aria-hidden
            />

            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                메인 입력 화면
              </p>
              <h2 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
                출발지와 민원 목적을 고르면,
                <span className="block text-[var(--accent-strong)]">
                  demo 추천 결과를 바로 확인할 수 있습니다.
                </span>
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                현재 위치를 사용할 수 있고, 위치 권한이 없더라도 서울시청 기본 좌표로
                동일한 심사용 결과를 재현할 수 있습니다.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="originLabel"
                  className="text-sm font-semibold text-[var(--foreground)]"
                >
                  출발지
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
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
                    className="min-h-14 flex-1 rounded-[1.25rem] border border-[var(--line)] bg-white px-4 text-base outline-none ring-0 placeholder:text-[var(--muted)] focus:border-[var(--accent-strong)]"
                    aria-invalid={Boolean(fieldErrors.originLabel)}
                    aria-describedby="origin-help"
                  />
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating || isSubmitting}
                    className="min-h-14 rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface-strong)] px-5 text-sm font-semibold text-[var(--foreground)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(210,154,0,0.16)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLocating ? "위치 확인 중..." : "현재 위치 사용"}
                  </button>
                </div>
                <p id="origin-help" className="text-sm text-[var(--muted)]">
                  {locationStatus}
                </p>
                {fieldErrors.originLabel ? (
                  <p className="text-sm font-medium text-[var(--accent-strong)]">
                    {fieldErrors.originLabel}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-[var(--foreground)]">
                    민원 목적
                  </label>
                  <span className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    5개 demo 시나리오
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
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
                        className={`rounded-[1.4rem] border px-4 py-4 text-left ${
                          selected
                            ? "border-[var(--accent-strong)] bg-white shadow-[0_18px_35px_rgba(210,154,0,0.14)]"
                            : "border-[var(--line)] bg-white/80 hover:-translate-y-0.5 hover:border-[var(--accent)]"
                        }`}
                        aria-pressed={selected}
                      >
                        <p className="text-base font-semibold text-[var(--foreground)]">
                          {purpose.label}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          {purpose.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {fieldErrors.purposeId ? (
                  <p className="text-sm font-medium text-[var(--accent-strong)]">
                    {fieldErrors.purposeId}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 rounded-[1.5rem] border border-[var(--line)] bg-white/75 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-[var(--muted)]">전송 모드</p>
                  <p className="mt-1 font-semibold">demo</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted)]">기준 좌표</p>
                  <p className="mt-1 font-semibold">{formatCoordinates(coordinates)}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted)]">백엔드 후보</p>
                  <p className="mt-1 break-all font-semibold">{appConfig.apiBaseUrl}</p>
                </div>
              </div>

              {requestError ? (
                <div className="rounded-[1.25rem] border border-[rgba(210,154,0,0.24)] bg-[rgba(255,243,194,0.9)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                  {requestError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || isLocating}
                className="flex min-h-14 w-full items-center justify-center rounded-[1.35rem] bg-[var(--accent)] px-5 text-base font-semibold text-[var(--foreground)] shadow-[0_20px_40px_rgba(210,154,0,0.2)] hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "추천 요청 중..." : "추천 요청"}
              </button>
            </form>
          </section>

          <aside className="flex flex-col gap-6">
            <section className="soft-card rounded-[2rem] px-6 py-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                요청 흐름
              </p>
              <ol className="mt-5 space-y-3 text-sm leading-7 text-[var(--muted)]">
                <li className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 px-4 py-3">
                  출발지와 민원 목적을 입력합니다.
                </li>
                <li className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 px-4 py-3">
                  프론트가 `/api/recommend`로 demo POST 요청을 보냅니다.
                </li>
                <li className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 px-4 py-3">
                  프록시가 Lightsail 추천 백엔드와 연결해 결과를 받아옵니다.
                </li>
              </ol>
            </section>

            <section className="soft-card rounded-[2rem] px-6 py-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                추천 결과
              </p>

              {result ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/85 p-5">
                    <p className="text-sm text-[var(--muted)]">요청 요약</p>
                    <p className="mt-2 text-lg font-semibold">
                      {result.request.originLabel} ·{" "}
                      {
                        purposeOptions.find((purpose) => purpose.id === result.request.purposeId)
                          ?.label
                      }
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {result.summary.returnedRecommendationCount}곳 추천 / 데이터 소스{" "}
                      {result.meta.dataSource}
                    </p>
                  </div>

                  {result.recommendations.map((office) => (
                    <article
                      key={office.id}
                      className="rounded-[1.5rem] border border-[var(--line)] bg-white/90 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                            추천 {office.recommendation.rank}위
                          </p>
                          <h3 className="mt-2 text-lg font-semibold">{office.name}</h3>
                        </div>
                        <span className="rounded-full bg-[var(--surface-strong)] px-3 py-2 text-sm font-semibold">
                          {office.recommendation.score}점
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                        {office.address}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                        {office.recommendation.reason}
                      </p>

                      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[1rem] bg-[var(--surface)] px-3 py-3">
                          <dt className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                            대기 인원
                          </dt>
                          <dd className="mt-1 text-base font-semibold">
                            {office.waiting.count}명
                          </dd>
                        </div>
                        <div className="rounded-[1rem] bg-[var(--surface)] px-3 py-3">
                          <dt className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                            이동시간
                          </dt>
                          <dd className="mt-1 text-base font-semibold">
                            {office.travel.minutes}분
                          </dd>
                        </div>
                        <div className="rounded-[1rem] bg-[var(--surface)] px-3 py-3">
                          <dt className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                            처리 업무
                          </dt>
                          <dd className="mt-1 text-sm font-semibold leading-6">
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
                <div className="mt-5 rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/70 px-5 py-8 text-sm leading-7 text-[var(--muted)]">
                  아직 추천 결과가 없습니다. 출발지와 민원 목적을 입력하고 demo 추천을
                  요청해 보세요.
                </div>
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
