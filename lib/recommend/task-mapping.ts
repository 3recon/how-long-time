import { purposeTaskMappings } from "@/data/recommend/task-mappings";
import {
  normalizeTaskName,
  tokenizeTaskName,
} from "@/lib/recommend/task-normalize";
import type { PublicDataWaitingItem } from "@/types/public-data";
import type {
  MatchingRuleType,
  PurposeTaskMapping,
  PurposeTaskRule,
  RecommendPurposeId,
  SupportedTaskMatch,
} from "@/types/recommend";

export interface PurposeTaskFilterEntry {
  item: PublicDataWaitingItem;
  match: SupportedTaskMatch;
  normalizedTaskName: string;
}

function normalizeRuleKeyword(keyword: string): string {
  return normalizeTaskName(keyword);
}

function buildTaskSearchSpace(taskName: string) {
  const normalizedTaskName = normalizeTaskName(taskName);
  const tokens = tokenizeTaskName(taskName).map((token) => normalizeTaskName(token));

  return {
    normalizedTaskName,
    searchValues: [normalizedTaskName, ...tokens],
  };
}

function matchesRule(
  rule: PurposeTaskRule,
  searchValues: string[],
  normalizedTaskName: string,
): boolean {
  const normalizedKeyword = normalizeRuleKeyword(rule.keyword);

  if (normalizedKeyword.length === 0) {
    return false;
  }

  if (rule.type === "exact") {
    return (
      normalizedTaskName === normalizedKeyword ||
      searchValues.some((value) => value === normalizedKeyword)
    );
  }

  return searchValues.some((value) => value.includes(normalizedKeyword));
}

function findFirstMatchingRule(
  taskName: string,
  rules: PurposeTaskRule[],
): { normalizedTaskName: string; ruleType: MatchingRuleType } | null {
  const { normalizedTaskName, searchValues } = buildTaskSearchSpace(taskName);
  const matchedRule = rules.find((rule) =>
    matchesRule(rule, searchValues, normalizedTaskName),
  );

  if (!matchedRule) {
    return null;
  }

  return {
    normalizedTaskName,
    ruleType: matchedRule.type,
  };
}

export function getPurposeTaskMapping(
  purposeId: RecommendPurposeId,
): PurposeTaskMapping {
  const mapping = purposeTaskMappings.find((entry) => entry.purposeId === purposeId);

  if (!mapping) {
    throw new Error(`지원되지 않는 민원 목적입니다: ${purposeId}`);
  }

  return mapping;
}

export function matchPurposeForTaskName(
  purposeId: RecommendPurposeId,
  taskName: string,
): SupportedTaskMatch | null {
  const mapping = getPurposeTaskMapping(purposeId);
  const includeMatch = findFirstMatchingRule(taskName, mapping.includeRules);

  if (!includeMatch) {
    return null;
  }

  const excludeMatch = findFirstMatchingRule(taskName, mapping.excludeRules);

  if (excludeMatch) {
    return null;
  }

  return {
    taskName,
    ruleType: includeMatch.ruleType,
  };
}

export function filterWaitingItemsByPurpose(
  items: PublicDataWaitingItem[],
  purposeId: RecommendPurposeId,
): PurposeTaskFilterEntry[] {
  return items.flatMap((item) => {
    const match = matchPurposeForTaskName(purposeId, item.taskName);

    if (!match) {
      return [];
    }

    return [
      {
        item,
        match,
        normalizedTaskName: normalizeTaskName(item.taskName),
      },
    ];
  });
}
