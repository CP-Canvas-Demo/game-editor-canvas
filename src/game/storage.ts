export type ProgressionMode = "campaign" | "single";

const KEY_MODE = "neon-trail.progressionMode";
const KEY_BEST = "neon-trail.bestScores";

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadProgressionMode(): ProgressionMode {
  const value = storage()?.getItem(KEY_MODE);
  return value === "single" || value === "campaign" ? value : "campaign";
}

export function saveProgressionMode(mode: ProgressionMode): void {
  try {
    storage()?.setItem(KEY_MODE, mode);
  } catch {
    // Persistence is a nicety; ignore quota or privacy-mode failures.
  }
}

export function loadBestScores(): Record<string, number> {
  const raw = storage()?.getItem(KEY_BEST);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const result: Record<string, number> = {};
    for (const [id, score] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof score === "number" && Number.isFinite(score)) result[id] = score;
    }
    return result;
  } catch {
    return {};
  }
}

/** Stores `score` for `levelId` when it beats the stored value. Returns the new best. */
export function recordBestScore(levelId: string, score: number): number {
  const scores = loadBestScores();
  const best = Math.max(scores[levelId] ?? 0, score);
  scores[levelId] = best;
  try {
    storage()?.setItem(KEY_BEST, JSON.stringify(scores));
  } catch {
    // Ignore persistence failures.
  }
  return best;
}
