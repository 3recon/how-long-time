"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { RecommendResultsLayout } from "@/components/recommend/recommend-results-layout";
import { getRequestErrorMessage } from "@/components/recommend/recommend-ui";
import { appConfig } from "@/lib/env";
import { createClientDemoRecommendResponse } from "@/lib/recommend/client-demo";
import {
  getInitialSelectedOfficeId,
  resolveSelectedOffice,
} from "@/lib/recommend/presentation";
import { parseRecommendResultsSearchParams } from "@/lib/recommend/route-state";
import type {
  RecommendErrorResponse,
  RecommendResponse,
} from "@/types/recommend";

function readValue(
  input: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = input[key];
  return Array.isArray(value) ? value[0] : value;
}

function buildRequestQuery(request: {
  purposeId: string;
  originLabel: string;
  origin: { lat: number; lng: number };
  mode: string;
}): URLSearchParams {
  return new URLSearchParams({
    purposeId: request.purposeId,
    originLabel: request.originLabel,
    lat: String(request.origin.lat),
    lng: String(request.origin.lng),
    mode: request.mode,
  });
}

export function RecommendResultsPage(props: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const parsed = useMemo(
    () => parseRecommendResultsSearchParams(props.searchParams),
    [props.searchParams],
  );
  const requestValue = parsed.ok ? parsed.value : null;
  const initialSelected = useMemo(
    () => readValue(props.searchParams, "selected") ?? null,
    [props.searchParams],
  );
  const requestKey = requestValue
    ? `${requestValue.purposeId}|${requestValue.originLabel}|${requestValue.origin.lat}|${requestValue.origin.lng}|${requestValue.mode}`
    : "invalid";
  const requestQueryString = requestValue
    ? buildRequestQuery(requestValue).toString()
    : "";
  const requestMode = requestValue?.mode ?? null;
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [requestError, setRequestError] = useState<string | null>(
    parsed.ok ? null : parsed.details,
  );
  const [requestNotice, setRequestNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(parsed.ok);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(
    initialSelected,
  );

  useEffect(() => {
    if (!requestValue) {
      setIsLoading(false);
      return;
    }

    const currentRequest = requestValue;
    let cancelled = false;

    async function loadResults() {
      setIsLoading(true);
      setRequestError(null);

      if (currentRequest.mode === "demo") {
        setResult(createClientDemoRecommendResponse(currentRequest));
        setRequestNotice("demo 모드 샘플 결과를 바로 불러왔습니다.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/recommend?${requestQueryString}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const errorBody = (await response.json().catch(() => null)) as
            | RecommendErrorResponse
            | null;

          if (requestMode === "demo") {
            if (!cancelled) {
              setResult(createClientDemoRecommendResponse(currentRequest));
              setRequestNotice(
                "추천 백엔드 연결이 불안정해 로컬 demo 샘플 결과로 이어서 비교합니다.",
              );
            }
            return;
          }

          if (!cancelled) {
            setResult(null);
            setRequestNotice(null);
            setRequestError(getRequestErrorMessage(errorBody?.error));
          }
          return;
        }

        const responseBody = (await response.json()) as RecommendResponse;
        if (!cancelled) {
          setResult(responseBody);
          setRequestNotice(
            responseBody.meta.mode === "demo"
              ? "query string 기반으로 같은 demo 추천 결과를 다시 불러왔습니다."
              : null,
          );
        }
      } catch {
        if (requestMode === "demo") {
          if (!cancelled) {
            setResult(createClientDemoRecommendResponse(currentRequest));
            setRequestNotice(
              "네트워크 오류가 있어도 demo 샘플 결과로 기본 비교 흐름을 유지합니다.",
            );
          }
          return;
        }

        if (!cancelled) {
          setResult(null);
          setRequestNotice(null);
          setRequestError("추천 요청 중 네트워크 오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadResults();

    return () => {
      cancelled = true;
    };
  }, [requestKey, requestMode, requestQueryString, requestValue]);

  useEffect(() => {
    if (!result) {
      setSelectedOfficeId(null);
      return;
    }

    setSelectedOfficeId((current) => {
      if (current) {
        return resolveSelectedOffice(result.recommendations, current)?.id ?? current;
      }

      return (
        resolveSelectedOffice(result.recommendations, initialSelected)?.id ??
        getInitialSelectedOfficeId(result)
      );
    });
  }, [initialSelected, result]);

  useEffect(() => {
    if (!requestValue || !selectedOfficeId) {
      return;
    }

    if (readValue(props.searchParams, "selected") === selectedOfficeId) {
      return;
    }

    const nextSearchParams = buildRequestQuery(requestValue);
    nextSearchParams.set("selected", selectedOfficeId);
    router.replace(`${pathname}?${nextSearchParams.toString()}`, {
      scroll: false,
    });
  }, [pathname, props.searchParams, requestValue, router, selectedOfficeId]);

  if (!requestValue) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[900px] items-center px-4 py-8 sm:px-6">
        <section className="soft-card w-full rounded-[32px] border-[rgba(17,17,17,0.08)] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
            Invalid Result State
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
            결과 화면을 다시 열 수 없습니다
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            주소에 필요한 추천 조건이 부족합니다. 첫 화면에서 출발지와 민원
            목적을 다시 입력해 주세요.
          </p>
          <p className="mt-4 rounded-2xl border border-[rgba(220,38,38,0.16)] bg-[rgba(220,38,38,0.06)] px-4 py-3 text-sm text-[var(--foreground)]">
            {requestError}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-12 items-center rounded-2xl border border-[var(--foreground)] bg-[var(--foreground)] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(17,17,17,0.16)]"
          >
            입력 화면으로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(211,166,63,0.24),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(31,58,95,0.08),transparent_28%)]" />
      <div className="relative mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-end">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-[20px] border border-[var(--foreground)] bg-[var(--foreground)] px-4 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(17,17,17,0.14)]"
          >
            처음부터 다시 시작
          </Link>
        </div>

        {requestError ? (
          <div className="rounded-[20px] border border-[rgba(220,38,38,0.18)] bg-[rgba(220,38,38,0.06)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">
            {requestError}
          </div>
        ) : null}

        {isLoading ? (
          <section className="soft-card flex min-h-[420px] items-center justify-center rounded-[28px] border-[rgba(17,17,17,0.08)] px-6 text-center text-sm leading-6 text-[var(--muted)]">
            결과 화면을 준비하고 있습니다.
          </section>
        ) : (
          <RecommendResultsLayout
            appKey={appConfig.kakaoMapAppKey}
            result={result}
            selectedOfficeId={selectedOfficeId}
            onSelectOffice={setSelectedOfficeId}
            fallbackOrigin={requestValue.origin}
            fallbackOriginLabel={requestValue.originLabel}
            emptyMessage="아직 추천 결과가 없습니다. 첫 화면에서 조건을 다시 입력해 주세요."
          />
        )}
      </div>
    </main>
  );
}
