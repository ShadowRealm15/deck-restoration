import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Copy,
  FileDown,
  Loader2,
  Check,
  Sparkles,
  Presentation,
  Minimize2,
  Trash2,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { exportDeckToPdf } from "@/lib/deck-pdf";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/SettingsModal";
import { LockScreen } from "@/components/LockScreen";
import { StrategyForm } from "@/components/StrategyForm";
import { DeckPreview } from "@/components/DeckPreview";

import { notifyGeminiError } from "@/lib/gemini-toast";
import { safeHandler } from "@/lib/safe-async";
import { useCooldown } from "@/hooks/use-cooldown";

import {
  EMPTY_DECK,
  generateStrategy,
  isDeckEmpty,
  loadApiKey,
  rewriteField,
  type BriefInput,
  type DeckField,
  type StrategyDeck,
} from "@/lib/brand-strategy";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BrandStrat AI — Generate $3,000 Brand Strategy Decks" },
      {
        name: "description",
        content:
          "BrandStrat AI turns a short client brief into a premium, editable brand strategy deck you can present and export as a client-ready PDF.",
      },
      { property: "og:title", content: "BrandStrat AI — Premium Brand Strategy Decks" },
      {
        property: "og:description",
        content:
          "Turn a short client brief into a complete positioning, messaging and visual direction deck you can hand off today.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const EMPTY_BRIEF: BriefInput = {
  brandName: "",
  industry: "",
  offering: "",
  audience: "",
  vibe: "",
};

const DECK_STORAGE_KEY = "brandstrat.deck";
const BRIEF_STORAGE_KEY = "brandstrat.brief";
const AUTH_STORAGE_KEY = "brandstrat.unlocked";

function Index() {
  const [unlocked, setUnlocked] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [brief, setBrief] = useState<BriefInput>(EMPTY_BRIEF);
  const [apiKey, setApiKey] = useState("");
  const [deck, setDeck] = useState<StrategyDeck>(EMPTY_DECK);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rewriting, setRewriting] = useState<DeckField | null>(null);
  const generateCooldown = useCooldown(4000);
  const rewriteCooldown = useCooldown(3000);
  
  const [copied, setCopied] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [invalidFields, setInvalidFields] = useState<(keyof BriefInput)[]>([]);
  const deckRef = useRef<HTMLDivElement>(null);
  const pdfDeckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(AUTH_STORAGE_KEY) === "true") setUnlocked(true);
    } catch {
      /* storage unavailable */
    }
    setAuthChecked(true);
    setApiKey(loadApiKey());
    // Every field of the Brief starts blank on a fresh mount — including the
    // vibe — and the deck resets with it, so nothing is left stale.
    setBrief({ ...EMPTY_BRIEF });
    setInvalidFields([]);
    setDeck(EMPTY_DECK);
    setPresenting(false);
    try {
      window.localStorage.removeItem(DECK_STORAGE_KEY);
      window.localStorage.removeItem(BRIEF_STORAGE_KEY);
    } catch {
      /* ignore corrupt autosave */
    }
  }, []);

  const updateBrief = (next: BriefInput) => {
    setInvalidFields([]);
    setBrief(next);
  };

  const hasDeck = !isDeckEmpty(deck);

  const handleGenerate = async () => {
    // Strict validation BEFORE any API-key check or API call.
    const missing = (["brandName", "industry", "offering", "audience"] as const).filter(
      (field) => !brief[field].trim(),
    );
    if (missing.length > 0) {
      setInvalidFields(missing);
      toast.error("Please complete all fields in The Brief before generating.");
      return;
    }
    const key = loadApiKey();
    if (!key) {
      toast.error("Add your Gemini API key first", {
        description: "Open the settings gear in the top right corner.",
      });
      return;
    }

    if (loading || generateCooldown.cooling) return;

    setLoading(true);
    setDeck(EMPTY_DECK);
    try {
      setDeck(await generateStrategy(brief, key));
      toast.success("Strategy created by Gemini AI");
      requestAnimationFrame(() =>
        deckRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    } catch (error) {
      // Handled here so the rejection never escapes as `Uncaught (in promise)`.
      notifyGeminiError(error);
    } finally {
      // Always clear loading state so the button returns to a clickable state.
      setLoading(false);
      generateCooldown.start();
    }
  };

  const handleRewrite = async (field: DeckField) => {
    if (rewriting !== null || rewriteCooldown.cooling) return;
    const key = loadApiKey();
    if (!key) {
      toast.error("Please enter your Gemini API key in the settings first.");
      return;
    }
    setRewriting(field);
    try {
      setDeck(await rewriteField(field, brief, deck, key));
      toast.success("Section rewritten successfully");
    } catch (error) {
      notifyGeminiError(error);
    } finally {
      setRewriting(null);
      rewriteCooldown.start();
    }
  };

  const handleCopy = async () => {
    if (!hasDeck) return;
    const text = [
      `${brief.brandName || "Brand"} — Brand Strategy Deck`,
      ``,
      `EXECUTIVE SUMMARY\n${deck.executiveSummary}`,
      `AUDIENCE EMPATHY\nPain: ${deck.audienceEmpathy.pain}\nDream: ${deck.audienceEmpathy.dream}`,
      `STRATEGIC POSITIONING\n${deck.strategicPositioning}`,
      `HERO MESSAGING\n${deck.heroMessaging.map((h) => `• ${h}`).join("\n")}`,
      `VISUAL IDENTITY\nColors: ${deck.visualIdentity.hexColors.join(", ")}\n${deck.visualIdentity.toneSliders
        .map((s) => `${s.name}: ${s.value}/10`)
        .join("\n")}`,
      `ACTION PLAN\n${deck.actionPlan.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
    ].join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to Clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Clipboard can reject (permissions / insecure context) — absorb it.
      console.error("Clipboard Error:", error);
      toast.error("Couldn't copy to clipboard.");
    }
  };


  const handleExport = async () => {
    // Capture the hidden fixed-width desktop clone, never the responsive on-screen DOM.
    const el = pdfDeckRef.current;
    if (!el || !hasDeck || exporting) return;
    setExporting(true);
    toast.info("Preparing your PDF… Please wait a moment.");
    try {
      await exportDeckToPdf(el, `${brief.brandName || "Brand"}-Strategy-Deck.pdf`);
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  const handleClear = () => {
    // One shared reset path: the brief (all fields, vibe included) and the deck
    // both go back to their identical initial state.
    setBrief({ ...EMPTY_BRIEF });
    setInvalidFields([]);
    setDeck(EMPTY_DECK);
    setPresenting(false);
    try {
      window.localStorage.removeItem(DECK_STORAGE_KEY);
      window.localStorage.removeItem(BRIEF_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    toast.success("Deck cleared");
  };

  if (!authChecked) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!unlocked) {
    return (
      <LockScreen
        onUnlock={() => {
          try {
            window.localStorage.setItem(AUTH_STORAGE_KEY, "true");
          } catch {
            /* storage unavailable */
          }
          setUnlocked(true);
        }}
      />
    );
  }

  return (
    <div className="shell-gradient flex min-h-screen flex-col bg-background md:h-screen md:overflow-hidden">
      <header className="no-print grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-glass-border px-5 py-3.5 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              BrandStrat <span className="text-gradient-primary">AI</span>
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Client brief in. $3,000 strategy deck out.
            </p>
          </div>
        </div>
        <span className="hidden shrink-0 items-center gap-2 rounded-full border border-glass-border bg-glass px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">
          <span className={`size-1.5 rounded-full ${apiKey ? "bg-primary" : "bg-destructive"}`} />
          {apiKey ? "Gemini connected" : "No API key"}
        </span>
      </header>

      <main className="flex min-h-0 flex-1 flex-col md:flex-row">
        <AnimatePresence initial={false}>
          {!presenting && (
            <motion.aside
              key="brief"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="no-print relative flex min-h-0 w-full flex-col border-b border-glass-border md:w-[35%] md:border-b-0 md:border-r"
            >
              <div className="min-h-0 flex-1 px-5 py-6 md:overflow-y-auto lg:px-6">
                <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  The Brief
                </h2>
                <StrategyForm
                  value={brief}
                  onChange={updateBrief}
                  onSubmit={safeHandler(handleGenerate)}
                  loading={loading}
                  cooling={generateCooldown.cooling}
                  invalidFields={invalidFields}
                />
              </div>
              <div className="sticky bottom-0 z-20 border-t border-glass-border bg-background/85 px-5 py-3 backdrop-blur-xl md:hidden">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    deckRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  <ArrowDown className="size-4" />
                  View Strategy
                </Button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <section
          ref={deckRef}
          className="print-deck flex min-h-screen min-w-0 flex-1 flex-col md:min-h-0 md:scroll-mt-0"
          style={{ backgroundColor: "#12161d !important", color: "#f4f6f8 !important" }}
        >
          <div className="no-print sticky top-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-glass-border bg-background/70 px-5 py-3 backdrop-blur-xl lg:px-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Strategy Deck
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={safeHandler(handleCopy)}
                disabled={!hasDeck || loading}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                Copy
              </Button>
              <Button
                variant={presenting ? "default" : "secondary"}
                size="sm"
                onClick={() => setPresenting((v) => !v)}
                disabled={!hasDeck || loading}
              >
                {presenting ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Presentation className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {presenting ? "Exit Presentation" : "Presentation Mode"}
                </span>
              </Button>
              <Button
                size="sm"
                onClick={safeHandler(handleExport)}
                disabled={!hasDeck || loading || exporting}
              >
                {exporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileDown className="size-4" />
                )}
                {exporting ? "Preparing PDF..." : "Export PDF"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={!hasDeck || loading}
                title="Clear the saved deck"
              >
                <Trash2 className="size-4" />
                Clear
              </Button>
              <SettingsModal onSaved={setApiKey} />
            </div>
          </div>
          <div className="min-h-0 flex-1 px-5 py-5 md:overflow-y-auto lg:px-6">
            <DeckPreview
              key={presenting ? "present" : "edit"}
              deck={deck}
              onChange={setDeck}
              onRewrite={safeHandler(handleRewrite)}
              rewriting={rewriting}
              loading={loading}
              brandName={brief.brandName}
              presenting={presenting}
            />
          </div>
        </section>
      </main>

      {/*
        Hidden clone used ONLY for PDF capture. Rendered fully off-screen and
        inert (opacity 0, no pointer events) at a locked 850px canvas width so
        the export keeps the 2-column bento layout with large, readable
        typography once fitted to A4 — the live UI is never restyled.
      */}
      {hasDeck && (
        <div
          ref={pdfDeckRef}
          aria-hidden
          className="pointer-events-none fixed left-[-9999px] top-0 box-border w-[794px] min-w-[794px] overflow-hidden opacity-0"
          style={{ backgroundColor: "#0d0e11", color: "#f8fafc" }}
        >

          <DeckPreview
            deck={deck}
            onChange={() => {}}
            onRewrite={() => {}}
            rewriting={null}
            loading={false}
            brandName={brief.brandName}
            forPdf
          />
        </div>
      )}
    </div>
  );
}
