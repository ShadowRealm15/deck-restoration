import { GoogleGenAI } from "@google/genai";

export const API_KEY_STORAGE_KEY = "brandstrat.gemini.apiKey";

export type BriefInput = {
  brandName: string;
  industry: string;
  offering: string;
  audience: string;
  vibe: string;
};

export function loadApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(API_KEY_STORAGE_KEY) ?? "";
}

export function saveApiKey(key: string) {
  if (typeof window === "undefined") return;
  if (key.trim()) window.localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  else window.localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export type ToneSlider = { name: string; value: number };

export type StrategyDeck = {
  executiveSummary: string;
  audienceEmpathy: { pain: string; dream: string };
  strategicPositioning: string;
  heroMessaging: string[];
  visualIdentity: {
    hexColors: string[];
    toneSliders: ToneSlider[];
    typography: { display: string; body: string };
    artDirection: string;
  };
  actionPlan: string[];
};

export type DeckField = keyof StrategyDeck;

const SYSTEM_PROMPT = `"Generate a comprehensive, high-energy digital brand strategy deck as a clean JSON object. Maintain a distinct, modern tone without generic corporate clichés.

Strictly enforce this JSON schema and data fields:

1. 'Executive Summary': 2 vivid sentences detailing the brand's core mission and the legacy industry narrative being disrupted.

2. 'Audience Empathy': An object containing:

   - 'Pain': 1-2 sentences describing the customer's current frustration, fatigue, or routine limitation.

   - 'Dream': 1-2 sentences describing their ideal, liberating outcome.

3. 'Strategic Positioning': The unique brand angle in 1-2 concise sentences.

4. 'Hero Messaging': An array of 3 memorable, high-impact headlines using strong action verbs.

5. 'Visual Identity': An object containing:

   - 'Colors': An array of 3 high-contrast modern Hex codes.

   - 'Typography': An object with 'Display' (suggested display font name) and 'Body' (suggested body font name).

   - 'ArtDirection': EXACTLY 1 sentence defining photography, lighting, or 3D visual styling for creative teams (MUST NOT BE EMPTY OR OMITTED).

   - 'Sliders': An array of 3 design tone scales formatted strictly as 'Concept A Vs Concept B: X/10'.

6. 'Action Plan': An array of 3 actionable directives (under 25 words each):

   - Directive 1: A specific CSS/React UI motion specification (e.g., Framer Motion hover/scroll physics with scale/easing values).

   - Directive 2: A copywriting guideline formatted strictly as 'Reframe copy from [Technical Before text] to [High-energy After text]'.

   - Directive 3: A concrete interactive web component or calculator concept.

Return raw valid JSON only. Do not include markdown formatting or backticks."`;

export const EMPTY_DECK: StrategyDeck = {
  executiveSummary: "",
  audienceEmpathy: { pain: "", dream: "" },
  strategicPositioning: "",
  heroMessaging: [],
  visualIdentity: { hexColors: [], toneSliders: [], typography: { display: "", body: "" }, artDirection: "" },
  actionPlan: [],
};

function briefBlock(brief: BriefInput) {
  return `CLIENT BRIEF
- Brand name: ${brief.brandName}
- Industry / niche: ${brief.industry}
- Core product / service: ${brief.offering}
- Target audience: ${brief.audience}
- Desired brand vibe: ${brief.vibe}`;
}

const MODELS = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];

function getClient(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

export type ApiErrorKind = "auth" | "rate-limit" | "overloaded" | "parse" | "unknown";

export class GeminiApiError extends Error {
  kind: ApiErrorKind;
  constructor(kind: ApiErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

const STATUS_NAMES: Record<string, number> = {
  UNAUTHENTICATED: 401,
  PERMISSION_DENIED: 403,
  RESOURCE_EXHAUSTED: 429,
  UNAVAILABLE: 503,
  INTERNAL: 500,
};

function errorStatus(err: unknown): number | null {
  const e = err as any;
  const candidates = [e?.status, e?.code, e?.error?.code, e?.error?.status, e?.response?.status];
  for (const c of candidates) {
    if (typeof c === "number") return c;
    if (typeof c === "string") {
      if (STATUS_NAMES[c.toUpperCase()]) return STATUS_NAMES[c.toUpperCase()]!;
      const n = Number(c);
      if (Number.isFinite(n) && n >= 100) return n;
    }
  }
  // The SDK often stringifies the provider payload into the message:
  // '{"error":{"code":503,"status":"UNAVAILABLE",...}}'
  const msg = String(e?.message ?? "");
  const codeMatch = msg.match(/"code"\s*:\s*(\d{3})/) ?? msg.match(/\b(401|403|429|500|503)\b/);
  if (codeMatch?.[1]) return Number(codeMatch[1]);
  for (const [name, code] of Object.entries(STATUS_NAMES)) {
    if (msg.toUpperCase().includes(name)) return code;
  }
  return null;
}

function isAuthError(err: unknown): boolean {
  const status = errorStatus(err);
  if (status === 401 || status === 403) return true;
  const msg = String((err as any)?.message ?? "").toLowerCase();
  return msg.includes("api key not valid") || msg.includes("api_key_invalid");
}

function isOverloaded(err: unknown): boolean {
  const status = errorStatus(err);
  const msg = String((err as any)?.message ?? "").toLowerCase();
  return (
    status === 503 ||
    status === 429 ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable") ||
    msg.includes("service unavailable")
  );
}

export function isRateLimited(err: unknown): boolean {
  if (err instanceof GeminiApiError) return err.kind === "rate-limit";
  const msg = String((err as any)?.message ?? "").toLowerCase();
  return (
    errorStatus(err) === 429 ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota")
  );
}

/** True for 503/429 "service busy" style failures surfaced to the user. */
export function isBusyError(err: unknown): boolean {
  if (err instanceof GeminiApiError) return err.kind === "overloaded" || err.kind === "rate-limit";
  return isOverloaded(err) || isTimeoutError(err) || isServerError(err);
}

/** Classifies any thrown value into the kind used for user-facing messaging. */
export function classifyApiError(err: unknown): ApiErrorKind {
  if (err instanceof GeminiApiError) return err.kind;
  if (isAuthError(err)) return "auth";
  if (isRateLimited(err)) return "rate-limit";
  if (isOverloaded(err) || isTimeoutError(err) || isServerError(err)) return "overloaded";
  return "unknown";
}

export function apiErrorToast(err: unknown): { title: string; description?: string | undefined } {
  if (err instanceof GeminiApiError) {
    if (err.kind === "auth") {
      return { title: "Invalid API Key. Please check your settings." };
    }
    if (err.kind === "parse") {
      return { title: "Failed to parse strategy. Please try again." };
    }
    if (err.kind === "overloaded") {
      return {
        title:
          "The AI service is temporarily overloaded. Please try again in a few moments.",
      };
    }
    return { title: "API Error: Please check your Gemini API key in settings.", description: err.message };
  }
  return {
    title: "API Error: Please check your Gemini API key in settings.",
    description: err instanceof Error ? err.message : undefined,
  };
}

function stripFences(raw: string) {
  return raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

/** Never throws a raw SyntaxError: always a classified parse error. */
function parseJson(raw: string): unknown {
  const text = stripFences(raw);
  try {
    const parsed = JSON.parse(text);
    console.log("Parsed AI Data:", parsed);
    return parsed;
  } catch {
    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start >= 0 && end > start) {
        const parsed = JSON.parse(text.slice(start, end + 1));
        console.log("Parsed AI Data:", parsed);
        return parsed;
      }
    } catch {
      // fall through to the classified error below
    }
    throw new GeminiApiError("parse", "Failed to parse strategy. Please try again.");
  }
}

function asStrings(value: unknown, limit = 3): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean).slice(0, limit) : [];
}

const SLIDER_LABELS: Record<string, string> = {
  seriousToPlayful: "Serious to Playful",
  understatedToLoud: "Understated to Loud",
  traditionalToAvantGarde: "Traditional to Avant-Garde",
};

function humanizeSliderKey(key: string): string {
  return (
    SLIDER_LABELS[key] ??
    key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/\bTo\b/g, "to")
      .replace(/^./, (c) => c.toUpperCase())
  );
}

function clampSlider(value: unknown): number {
  return Math.min(10, Math.max(1, Math.round(Number(value)) || 5));
}

/** Parse a slider string like "Traditional vs Disruptive: 9/10". */
function parseSliderString(s: string): ToneSlider | null {
  const match = s.match(/^(.+?)\s*:\s*(\d{1,2})\s*\/\s*10\s*$/);
  if (!match) return null;
  const name = match[1]!.trim();
  const value = clampSlider(Number(match[2]));
  return name ? { name, value } : null;
}

/** Accepts both the sliders object schema and the legacy toneSliders array. */
function normalizeSliders(visual: any): ToneSlider[] {
  const raw = visual?.Sliders ?? visual?.sliders;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return Object.entries(raw as Record<string, unknown>)
      .map(([key, value]) => ({ name: humanizeSliderKey(key), value: clampSlider(value) }))
      .filter((s) => s.name)
      .slice(0, 3);
  }
  const list: unknown[] = Array.isArray(raw) ? raw : visual?.toneSliders;
  if (!Array.isArray(list)) return [];
  return (list as any[])
    .map((s) => {
      if (typeof s === "string") return parseSliderString(s);
      return { name: String(s?.name ?? "").trim(), value: clampSlider(s?.value) };
    })
    .filter((s): s is ToneSlider => s !== null && s.name !== "")
    .slice(0, 3);
}

function normalizeColors(visual: any): string[] {
  const raw = asStrings(visual?.Colors ?? visual?.colors ?? visual?.hexColors);
  return raw
    .map((c) => c.match(/#[0-9a-f]{3,8}/i)?.[0] ?? "")
    .filter((c) => /^#[0-9a-f]{3,8}$/i.test(c));
}

/** Safely read a value from an object using one or more candidate keys. */
function pick<T>(obj: any, ...keys: string[]): T | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of keys) {
    if (key in obj) return obj[key];
  }
  return undefined;
}

export function normalizeDeck(input: unknown): StrategyDeck {
  const d: any = input ?? {};
  const empathy: any = pick(d, "Audience Empathy", "audienceEmpathy") ?? {};
  const visual: any = pick(d, "Visual Identity", "visualIdentity") ?? {};
  return {
    executiveSummary: String(pick(d, "Executive Summary", "executiveSummary") ?? ""),
    audienceEmpathy: {
      pain: String(pick(empathy, "Pain", "pain") ?? ""),
      dream: String(pick(empathy, "Dream", "dream") ?? ""),
    },
    strategicPositioning: String(pick(d, "Strategic Positioning", "strategicPositioning") ?? ""),
    heroMessaging: asStrings(pick(d, "Hero Messaging", "heroMessaging")),
    visualIdentity: {
      hexColors: normalizeColors(visual),
      toneSliders: normalizeSliders(visual),
      typography: {
        display: String((visual?.Typography ?? visual?.typography)?.Display ?? (visual?.Typography ?? visual?.typography)?.display ?? ""),
        body: String((visual?.Typography ?? visual?.typography)?.Body ?? (visual?.Typography ?? visual?.typography)?.body ?? ""),
      },
      artDirection: String(visual?.["Art Direction"] ?? visual?.artDirection ?? ""),
    },
    actionPlan: asStrings(pick(d, "Action Plan", "actionPlan")),
  };
}

export function isDeckEmpty(deck: StrategyDeck): boolean {
  return (
    !deck?.executiveSummary &&
    !deck?.strategicPositioning &&
    !deck?.audienceEmpathy?.pain &&
    !(deck?.heroMessaging?.length ?? 0)
  );
}

async function callModel(
  apiKey: string,
  model: string,
  prompt: string,
  system?: string,
  timeoutMs = 18000,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await getClient(apiKey).models.generateContent({
      model,
      contents: prompt,
      config: {
        ...(system ? { systemInstruction: system } : {}),
        // Force strict JSON (prevents markdown leakage) and cap output so
        // responses are never truncated halfway through the document.
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
        abortSignal: controller.signal,
      },
    });
    return response.text ?? "";
  } catch (error) {
    // The SDK rejects with plain objects (not Error instances). Normalize the
    // known status cases here so nothing downstream ever propagates — or
    // unhandled-rejects with — a raw provider payload.
    if (isRateLimited(error)) {
      throw new GeminiApiError(
        "rate-limit",
        "Rate limit reached. Please wait a few seconds before generating again.",
      );
    }
    if (isOverloaded(error) || isServerError(error)) {
      throw new GeminiApiError(
        "overloaded",
        "AI server is temporarily overloaded (503). Please try again in a moment.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isTimeoutError(err: unknown): boolean {
  const e = err as any;
  if (e?.name === "AbortError") return true;
  const msg = String(e?.message ?? "").toLowerCase();
  return msg.includes("timeout") || msg.includes("aborted") || msg.includes("abort");
}

function isServerError(err: unknown): boolean {
  const status = errorStatus(err);
  return status !== null && status >= 500 && status < 600;
}

function isRetryable(err: unknown): boolean {
  return isTimeoutError(err) || isServerError(err) || isOverloaded(err);
}

async function tryModels(apiKey: string, prompt: string, system?: string) {
  let lastErr: unknown;
  for (const model of MODELS) {
    try {
      return await callModel(apiKey, model, prompt, system, 18000);
    } catch (err) {
      lastErr = err;
      if (isAuthError(err)) throw err;
      // Fall back through the model list for any other failure.
    }
  }
  throw lastErr;
}

async function generateText(apiKey: string, prompt: string, system?: string) {
  let lastErr: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await tryModels(apiKey, prompt, system);
    } catch (err) {
      lastErr = err;

      if (isAuthError(err)) {
        throw new GeminiApiError("auth", "Invalid API key");
      }

      if (isRetryable(err) && attempt < 2) {
        // Exponential backoff: 1s, then 2s before the next attempt.
        await wait(1000 * Math.pow(2, attempt));
      } else {
        // Terminal or final attempt: stop retrying.
        break;
      }
    }
  }

  if (isRateLimited(lastErr)) {
    throw new GeminiApiError(
      "rate-limit",
      "Rate limit reached. Please wait a few seconds before generating again.",
    );
  }
  if (isRetryable(lastErr)) {
    throw new GeminiApiError(
      "overloaded",
      "AI server is temporarily overloaded (503). Please try again in a moment.",
    );
  }
  throw new GeminiApiError(
    "unknown",
    lastErr instanceof Error ? lastErr.message : "Generation failed",
  );
}

export async function generateStrategy(
  brief: BriefInput,
  apiKey: string,
): Promise<StrategyDeck> {
  const raw = await generateText(
    apiKey,
    `${briefBlock(brief)}\n\nGenerate the full 6-part Brand Strategy Deck as strict JSON. Reflect the "${brief.vibe}" vibe in every recommendation.`,
    SYSTEM_PROMPT,
  );
  return normalizeDeck(parseJson(raw));
}

const FIELD_INSTRUCTIONS: Record<DeckField, string> = {
  executiveSummary: `Return JSON: { "executiveSummary": "one bold paragraph" }`,
  audienceEmpathy: `Return JSON: { "audienceEmpathy": { "pain": "string", "dream": "string" } }`,
  strategicPositioning: `Return JSON: { "strategicPositioning": "unique value plus the Enemy" }`,
  heroMessaging: `Return JSON: { "heroMessaging": ["hook 1", "hook 2", "hook 3"] }`,
  visualIdentity: `Return JSON: { "visualIdentity": { "colors": ["#RRGGBB","#RRGGBB","#RRGGBB"], "sliders": { "seriousToPlayful": 1-10, "understatedToLoud": 1-10, "traditionalToAvantGarde": 1-10 } } } with exactly 3 hex colors and all 3 sliders.`,
  actionPlan: `Return JSON: { "actionPlan": ["step 1", "step 2", "step 3"] }`,
};

export async function rewriteField(
  field: DeckField,
  brief: BriefInput,
  current: StrategyDeck,
  apiKey: string,
): Promise<StrategyDeck> {
  const raw = await generateText(
    apiKey,
    `${briefBlock(brief)}

Existing deck for context (do not repeat it verbatim):
${JSON.stringify(current)}

Rewrite ONLY the "${field}" section with a fresh, sharper angle. ${FIELD_INSTRUCTIONS[field]}
Strict JSON only, no markdown.`,
    SYSTEM_PROMPT,
  );
  const parsed = parseJson(raw) as Record<string, unknown>;
  const merged = normalizeDeck({ ...current, ...parsed });
  return { ...current, [field]: merged[field] } as StrategyDeck;
}

/** Generates a short comma-separated string of creative vibe keywords. */
export async function suggestVibe(
  brandName: string,
  industry: string,
  offering: string,
  apiKey: string,
): Promise<string> {
  const raw = await generateText(
    apiKey,
    `Based on the brand '${brandName}' in the '${industry}' industry${
      offering ? `, offering '${offering}'` : ""
    }, generate one creative brand vibe description: 3-5 evocative adjectives or mood keywords, comma-separated (e.g. "Modern, Minimalist, Warm & Artisanal"). Return ONLY a JSON object: { "vibe": "keyword1, keyword2, keyword3" }.`,
  );
  const parsed = parseJson(raw) as any;
  const vibe = String(parsed?.vibe ?? "").trim();
  if (!vibe) throw new Error("Unexpected AI response");
  return vibe;
}

export async function suggestFieldOptions(
  kind: "Core Product" | "Target Audience",
  brandName: string,
  industry: string,
  apiKey: string,
): Promise<string[]> {
  const raw = await generateText(
    apiKey,
    `Based on the brand '${brandName}' in the '${industry}' industry, generate 3 hyper-specific options for ${kind}. Keep each option concise (1-2 sentences) and high-value. Return ONLY a JSON array of 3 strings.`,
  );
  const parsed = parseJson(`{"options":${stripFences(raw)}}`) as any;
  const list = Array.isArray(parsed) ? parsed : parsed.options;
  if (!Array.isArray(list)) throw new Error("Unexpected AI response");
  return list.map(String).slice(0, 3);
}
