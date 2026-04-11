"use client";

import { useState } from "react";

import { KakaoMapPanel } from "@/components/recommend/kakao-map-panel";
import {
  RecommendationCard,
} from "@/components/recommend/recommend-ui";
import { getPurposeLabel } from "@/data/recommend/purpose-options";
import { getInitialSelectedOfficeId } from "@/lib/recommend/presentation";
import type { LocationPoint, RecommendResponse } from "@/types/recommend";

export function RecommendResultsLayout(props: {
  appKey: string;
  result: RecommendResponse | null;
  selectedOfficeId: string | null;
  onSelectOffice: (officeId: string) => void;
  fallbackOrigin: LocationPoint;
  fallbackOriginLabel: string;
  emptyMessage: string;
}) {
  const recommendations = props.result?.recommendations ?? [];
  const selectedId =
    props.selectedOfficeId ?? getInitialSelectedOfficeId(props.result);
  const [expandedOfficeId, setExpandedOfficeId] = useState<string | null>(null);
  const origin = props.result?.request.origin ?? props.fallbackOrigin;
  const originLabel =
    props.result?.request.originLabel || props.fallbackOriginLabel;
  const selectedPurposeLabel = props.result?.request.purposeId
    ? getPurposeLabel(props.result.request.purposeId)
    : null;

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,1fr)] lg:items-start xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,1fr)]">
      <div className="min-w-0 lg:flex lg:max-h-[calc(100dvh-8rem)] lg:min-h-[680px] lg:flex-col">
        <section className="soft-card min-w-0 rounded-[28px] border-[rgba(17,17,17,0.12)] p-5 sm:p-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden lg:p-5">
          {recommendations.length > 0 ? (
            <div className="space-y-4 lg:min-h-0 lg:flex-1 lg:overflow-auto lg:pr-2 lg:[scrollbar-gutter:stable]">
              {recommendations.map((office) => (
                <RecommendationCard
                  key={office.id}
                  office={office}
                  selectedPurposeLabel={selectedPurposeLabel}
                  selected={selectedId === office.id}
                  onSelect={() => props.onSelectOffice(office.id)}
                  expanded={expandedOfficeId === office.id}
                  onToggleDetails={() => {
                    props.onSelectOffice(office.id);
                    setExpandedOfficeId((current) =>
                      current === office.id ? null : office.id,
                    );
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[rgba(17,17,17,0.16)] px-5 py-8 text-center text-sm leading-6 text-[var(--muted)]">
              {props.emptyMessage}
            </div>
          )}
        </section>
      </div>

      <section className="min-w-0 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-8rem)] lg:min-h-[680px]">
        <KakaoMapPanel
          appKey={props.appKey}
          origin={origin}
          originLabel={originLabel}
          recommendations={recommendations}
          selectedOfficeId={selectedId}
          onSelectOffice={props.onSelectOffice}
        />
      </section>
    </div>
  );
}
