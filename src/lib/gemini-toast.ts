import { toast } from "sonner";

import { classifyApiError } from "./brand-strategy";

/**
 * Single funnel for every Gemini failure: logs cleanly and fires the
 * status-specific toast. Never throws, so it is safe inside `catch` blocks.
 */
export function notifyGeminiError(error: unknown) {
  console.error("Gemini API Error:", error);
  const kind = classifyApiError(error);

  if (kind === "rate-limit") {
    toast.warning("Rate limit reached. Please wait a few seconds before generating again.");
    return;
  }
  if (kind === "overloaded") {
    toast.error("AI server is temporarily overloaded (503). Please try again in a moment.");
    return;
  }
  if (kind === "auth") {
    toast.error("Invalid API Key. Please check your settings.");
    return;
  }
  if (kind === "parse") {
    toast.error("Failed to parse strategy. Please try again.");
    return;
  }
  toast.error("AI request failed. Please check your connection or try again.");
}
