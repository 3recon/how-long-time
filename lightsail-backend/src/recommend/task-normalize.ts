const taskNameAliases: Record<string, string> = {
  "가족 관계": "가족관계",
};

function replaceAliases(value: string): string {
  let normalized = value;

  for (const [source, target] of Object.entries(taskNameAliases)) {
    normalized = normalized.replaceAll(source, target);
  }

  return normalized;
}

export function normalizeTaskName(raw: string): string {
  return replaceAliases(raw)
    .replace(/\r?\n/g, " ")
    .replace(/\(\s*\d+[^\)]*창구\s*\)/g, " ")
    .replace(/^\s*\d+\.\s*/g, "")
    .replace(/[\/,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeTaskName(raw: string): string[] {
  const normalized = replaceAliases(raw)
    .replace(/\r?\n/g, " ")
    .replace(/\(\s*\d+[^\)]*창구\s*\)/g, " ")
    .replace(/^\s*\d+\.\s*/g, "")
    .trim();

  return normalized
    .split(/[\/,]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}
