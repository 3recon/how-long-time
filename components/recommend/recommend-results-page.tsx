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

const PUBLIC_DATA_API_LABEL = "\uacf5\uacf5\ub370\uc774\ud130 API";
const PUBLIC_DATA_FALLBACK_NOTICE =
  "\uacf5\uacf5\ub370\uc774\ud130 API \uc7a5\uc560\ub85c \uc778\ud574 demo fallback \uacb0\uacfc\ub85c \uc804\ud658\ud588\uc2b5\ub2c8\ub2e4.";
const QUERY_DEMO_NOTICE =
  "query string \uae30\ubc18\uc73c\ub85c \uac19\uc740 demo \ucd94\ucc9c \uacb0\uacfc\ub97c \ub2e4\uc2dc \ubd88\ub7ec\uc654\uc2b5\ub2c8\ub2e4.";
const NETWORK_DEMO_NOTICE =
  "\ub124\ud2b8\uc6cc\ud06c \uc624\ub958\uac00 \uc788\uc5b4 demo \uc0d8\ud50c \uacb0\uacfc\ub85c \uae30\ubcf8 \ube44\uad50 \ud654\uba74\uc744 \uc720\uc9c0\ud569\ub2c8\ub2e4.";
const NETWORK_ERROR_MESSAGE =
  "\ucd94\ucc9c \uc694\uccad \uc911 \ub124\ud2b8\uc6cc\ud06c \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.";
const INVALID_TITLE =
  "\uacb0\uacfc \ud654\uba74\uc744 \ub2e4\uc2dc \uc5f4 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4";
const INVALID_BODY =
  "\uc8fc\uc18c\uc5d0 \ud544\uc694\ud55c \ucd94\ucc9c \uc870\uac74\uc774 \ubd80\uc871\ud569\ub2c8\ub2e4. \uccab \ud654\uba74\uc5d0\uc11c \ucd9c\ubc1c\uc9c0\uc640 \ubbfc\uc6d0 \ubaa9\uc801\uc744 \ub2e4\uc2dc \uc785\ub825\ud574 \uc8fc\uc138\uc694.";
const BACK_TO_FORM_LABEL =
  "\uc785\ub825 \ud654\uba74\uc73c\ub85c \ub3cc\uc544\uac00\uae30";
const RESTART_LABEL = "\uc7ac\uc2dc\uc791";
const LOADING_LABEL =
  "\uacb0\uacfc \ud654\uba74\uc744 \uc900\ube44\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4.";
const EMPTY_MESSAGE =
  "\uc544\uc9c1 \ucd94\ucc9c \uacb0\uacfc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4. \uccab \ud654\uba74\uc5d0\uc11c \uc870\uac74\uc744 \ub2e4\uc2dc \uc785\ub825\ud574 \uc8fc\uc138\uc694.";

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

export function getPublicDataDemoFallbackNotice(
  errorBody: RecommendErrorResponse | null,
): string | null {
  if (
    errorBody?.error === "UPSTREAM_API_ERROR" &&
    errorBody.details?.includes(PUBLIC_DATA_API_LABEL)
  ) {
    return PUBLIC_DATA_FALLBACK_NOTICE;
  }

  return null;
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
        setRequestNotice(null);
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
          const fallbackNotice = getPublicDataDemoFallbackNotice(errorBody);

          if (fallbackNotice) {
            if (!cancelled) {
              setResult(createClientDemoRecommendResponse(currentRequest));
              setRequestError(null);
              setRequestNotice(fallbackNotice);
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
            responseBody.meta.mode === "demo" ? QUERY_DEMO_NOTICE : null,
          );
        }
      } catch {
        if (requestMode === "demo") {
          if (!cancelled) {
            setResult(createClientDemoRecommendResponse(currentRequest));
            setRequestNotice(NETWORK_DEMO_NOTICE);
          }
          return;
        }

        if (!cancelled) {
          setResult(null);
          setRequestNotice(null);
          setRequestError(NETWORK_ERROR_MESSAGE);
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
        return (
          resolveSelectedOffice(result.recommendations, current)?.id ?? current
        );
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
            {INVALID_TITLE}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {INVALID_BODY}
          </p>
          <p className="mt-4 rounded-2xl border border-[rgba(220,38,38,0.16)] bg-[rgba(220,38,38,0.06)] px-4 py-3 text-sm text-[var(--foreground)]">
            {requestError}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-12 items-center rounded-2xl border border-[var(--foreground)] bg-[var(--foreground)] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(17,17,17,0.16)]"
          >
            {BACK_TO_FORM_LABEL}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="relative mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="justify-self-start rounded-full border border-[rgba(17,17,17,0.14)] bg-white px-4 py-2 shadow-[0_10px_24px_rgba(17,17,17,0.05)]">
            <h2 className="text-xl font-semibold tracking-[-0.04em]">
              소요 시간 비교
            </h2>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center rounded-[18px] border border-[var(--foreground)] bg-[var(--foreground)] px-3.5 text-[13px] font-semibold text-white shadow-[0_14px_28px_rgba(17,17,17,0.14)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(36,92,154,0.14)]"
          >
            {RESTART_LABEL}
          </Link>
        </div>

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

        {isLoading ? (
          <section className="soft-card flex min-h-[420px] items-center justify-center rounded-[28px] border-[rgba(17,17,17,0.08)] px-6 text-center text-sm leading-6 text-[var(--muted)]">
            {LOADING_LABEL}
          </section>
        ) : (
          <RecommendResultsLayout
            appKey={appConfig.kakaoMapAppKey}
            result={result}
            selectedOfficeId={selectedOfficeId}
            onSelectOffice={setSelectedOfficeId}
            fallbackOrigin={requestValue.origin}
            fallbackOriginLabel={requestValue.originLabel}
            emptyMessage={EMPTY_MESSAGE}
          />
        )}
      </div>
    </main>
  );
}
