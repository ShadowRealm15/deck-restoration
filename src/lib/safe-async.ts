import { notifyGeminiError } from "./gemini-toast";

/**
 * Wraps an async handler so it can be passed directly to `onClick` / `onSubmit`
 * without React ignoring the returned promise. Any rejection that somehow
 * escapes the handler's own try/catch (including SDK 429 payloads) is absorbed
 * here and surfaced as a toast, never as `Uncaught (in promise)`.
 */
export function safeHandler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<unknown> | unknown,
) {
  return (...args: Args) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        void result.catch((error: unknown) => notifyGeminiError(error));
      }
    } catch (error) {
      notifyGeminiError(error);
    }
  };
}
