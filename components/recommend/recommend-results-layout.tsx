"use client";

import { useState } from "react";

import { KakaoMapPanel } from "@/components/recommend/kakao-map-panel";
import {
  RecommendationCard,
} from "@/components/recommend/recommend-ui";
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

  return (
    <div className="grid min-w-0 gap-4 lg:h-[calc(100dvh-7.5rem)] lg:min-h-[760px] lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:overflow-hidden xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
      <div className="min-w-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
        <section className="soft-card min-w-0 rounded-[28px] border-[rgba(17,17,17,0.08)] p-5 sm:p-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden lg:p-5">
          {recommendations.length > 0 ? (
            <div className="space-y-4 lg:min-h-0 lg:flex-1 lg:overflow-auto lg:pr-1">
              {recommendations.map((office) => (
                <RecommendationCard
                  key={office.id}
                  office={office}
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

      <section className="min-w-0 lg:h-full lg:min-h-0">
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
