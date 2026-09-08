import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Anti-spam cooldown: after a triggered request finishes, the caller stays
 * blocked for `ms` so rapid clicking cannot manufacture 429 rate limits.
 */
export function useCooldown(ms = 4000) {
  const [cooling, setCooling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const start = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setCooling(true);
    timer.current = setTimeout(() => setCooling(false), ms);
  }, [ms]);

  return { cooling, start };
}
