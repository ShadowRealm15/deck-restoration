const STORAGE_KEY = "brandstrat_suggestion_history";
const MAX_PER_FIELD = 5;

export type SuggestionEntry = {
  value: string;
  at: number;
};

export type SuggestionHistory = Record<string, SuggestionEntry[]>;

export function loadSuggestionHistory(): SuggestionHistory {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SuggestionHistory;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSuggestionHistory(history: SuggestionHistory) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    /* storage unavailable — history stays in memory only */
  }
}

/** Prepends new values for a field, de-duplicated, capped at the last 5. */
export function appendSuggestions(
  history: SuggestionHistory,
  field: string,
  values: string[],
): SuggestionHistory {
  const now = Date.now();
  const incoming = values
    .map((v) => v.trim())
    .filter(Boolean)
    .map((value, i) => ({ value, at: now + i }));
  const existing = history[field] ?? [];
  const merged: SuggestionEntry[] = [];
  for (const entry of [...incoming.reverse(), ...existing]) {
    if (merged.some((m) => m.value === entry.value)) continue;
    merged.push(entry);
    if (merged.length >= MAX_PER_FIELD) break;
  }
  return { ...history, [field]: merged };
}

export function formatEntryTime(at: number) {
  try {
    return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
