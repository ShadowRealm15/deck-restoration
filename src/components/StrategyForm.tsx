import { useEffect, useState } from "react";
import { History, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  appendSuggestions,
  formatEntryTime,
  loadSuggestionHistory,
  saveSuggestionHistory,
  type SuggestionHistory,
} from "@/lib/suggestion-history";

import {
  loadApiKey,
  suggestFieldOptions,
  suggestVibe,
  type BriefInput,
} from "@/lib/brand-strategy";
import { notifyGeminiError } from "@/lib/gemini-toast";
import { safeHandler } from "@/lib/safe-async";
import { useCooldown } from "@/hooks/use-cooldown";

type Props = {
  value: BriefInput;
  onChange: (next: BriefInput) => void;
  onSubmit: () => void;
  loading: boolean;
  cooling?: boolean;
  invalidFields?: (keyof BriefInput)[];
};

const baseFieldClass = "bg-background/50 focus-visible:ring-ring";

type SuggestKind = "Core Product" | "Target Audience";

export function StrategyForm({
  value,
  onChange,
  onSubmit,
  loading,
  cooling = false,
  invalidFields = [],
}: Props) {
  const fieldClass = (key: keyof BriefInput) =>
    `${baseFieldClass} ${
      invalidFields.includes(key)
        ? "border-red-500 ring-2 ring-red-500/20 focus-visible:ring-red-500/30"
        : "border-glass-border"
    }`;
  const [suggestions, setSuggestions] = useState<Partial<Record<SuggestKind, string[]>>>({});
  const [openPopover, setOpenPopover] = useState<SuggestKind | null>(null);
  const [openHistory, setOpenHistory] = useState<SuggestKind | null>(null);
  const [history, setHistory] = useState<SuggestionHistory>({});
  const [suggesting, setSuggesting] = useState<SuggestKind | null>(null);
  const [generatingVibe, setGeneratingVibe] = useState(false);
  const suggestCooldown = useCooldown(3000);

  useEffect(() => {
    setHistory(loadSuggestionHistory());
  }, []);

  const set = <K extends keyof BriefInput>(key: K, v: BriefInput[K]) =>
    onChange({ ...value, [key]: v });

  const fieldOf = (kind: SuggestKind): keyof BriefInput =>
    kind === "Core Product" ? "offering" : "audience";

  const recordHistory = (kind: SuggestKind, values: string[]) => {
    setHistory((prev) => {
      const next = appendSuggestions(prev, kind, values);
      saveSuggestionHistory(next);
      return next;
    });
  };

  const handleSuggest = async (kind: SuggestKind) => {
    // Anti-spam: ignore clicks while a request is in flight or cooling down.
    if (suggesting !== null || suggestCooldown.cooling) return;
    if (!value.brandName.trim() || !value.industry.trim()) {
      toast.error("Please enter a Brand Name and Industry first so the AI has context.");
      return;
    }
    const key = loadApiKey();
    if (!key) {
      toast.error("Please enter your Gemini API key in the settings first.");
      return;
    }

    setSuggesting(kind);
    toast.info("Brainstorming ideas... The AI is preparing your suggestions.");
    try {
      const options = await suggestFieldOptions(kind, value.brandName, value.industry, key);
      setSuggestions((prev) => ({ ...prev, [kind]: options }));
      recordHistory(kind, options);
      setOpenPopover(kind);
    } catch (error) {
      // Contained here so no rejection escapes to the top level.
      notifyGeminiError(error);
    } finally {
      // Always re-enable the button, whatever happened.
      setSuggesting(null);
      suggestCooldown.start();
    }
  };

  const handleGenerateVibe = async () => {
    if (generatingVibe || suggestCooldown.cooling) return;
    if (!value.brandName.trim() || !value.industry.trim()) {
      toast.error("Please enter a Brand Name and Industry first so the AI has context.");
      return;
    }
    const key = loadApiKey();
    if (!key) {
      toast.error("Please enter your Gemini API key in the settings first.");
      return;
    }
    setGeneratingVibe(true);
    toast.info("Generating vibe keywords...");
    try {
      const vibe = await suggestVibe(value.brandName, value.industry, value.offering, key);
      set("vibe", vibe);
      toast.success("Vibe generated");
    } catch (error) {
      notifyGeminiError(error);
    } finally {
      setGeneratingVibe(false);
      suggestCooldown.start();
    }
  };

  const pickSuggestion = (kind: SuggestKind, option: string) => {
    set(fieldOf(kind), option);
    setOpenPopover(null);
  };

  const restoreFromHistory = (kind: SuggestKind, option: string) => {
    set(fieldOf(kind), option);
    setOpenHistory(null);
    toast.success("Restored previous suggestion");
  };

  const renderHistoryButton = (kind: SuggestKind) => {
    const entries = history[kind] ?? [];
    const disabled = entries.length === 0 || loading;
    return (
      <Popover
        open={openHistory === kind}
        onOpenChange={(open) => setOpenHistory(open ? kind : null)}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="View last generated suggestions"
            aria-label="View last generated suggestions"
            className="size-6 border-glass-border text-muted-foreground hover:text-foreground"
            disabled={disabled}
          >
            <History className="size-3" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80 border-glass-border bg-popover p-2">
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Suggestion history
          </p>
          <div className="flex flex-col gap-1">
            {entries.map((entry, i) => (
              <button
                key={`${entry.at}-${i}`}
                type="button"
                title={entry.value}
                onClick={() => restoreFromHistory(kind, entry.value)}
                className="group rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
              >
                <span className="mb-0.5 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span>#{i + 1}</span>
                  <span>{formatEntryTime(entry.at)}</span>
                </span>
                <span className="line-clamp-2 text-sm leading-snug text-foreground group-hover:line-clamp-none">
                  {entry.value}
                </span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const renderSuggestButton = (kind: SuggestKind) => (
    <div className="flex items-center gap-1">
      <Popover
        open={openPopover === kind}
        onOpenChange={(open) => setOpenPopover(open ? kind : null)}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={safeHandler(() => handleSuggest(kind))}
            disabled={suggesting !== null || suggestCooldown.cooling || loading}
          >
            {suggesting === kind ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Wand2 className="size-3" />
            )}
            ✨ Auto-Suggest
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 border-glass-border bg-popover p-2">
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pick an option
          </p>
          <div className="flex flex-col gap-1">
            {(suggestions[kind] ?? []).map((option, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pickSuggestion(kind, option)}
                className="rounded-lg px-3 py-2 text-left text-sm leading-snug text-foreground transition-colors hover:bg-accent"
              >
                {option}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {renderHistoryButton(kind)}
    </div>
  );


  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex h-full flex-col gap-5"
    >
      <div className="space-y-2">
        <Label htmlFor="brandName">Client / Brand name</Label>
        <Input
          id="brandName"
          className={fieldClass("brandName")}
          placeholder="e.g., Nike"
          value={value.brandName}
          onChange={(e) => set("brandName", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry">Industry / niche</Label>
        <Input
          id="industry"
          className={fieldClass("industry")}
          placeholder="e.g., Athletic apparel & footwear"
          value={value.industry}
          onChange={(e) => set("industry", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="offering">Core product / service</Label>
          {renderSuggestButton("Core Product")}
        </div>
        <Textarea
          id="offering"
          rows={3}
          className={fieldClass("offering")}
          placeholder="e.g., Performance running shoes and training apparel"
          value={value.offering}
          onChange={(e) => set("offering", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="audience">Target audience &amp; pain points</Label>
          {renderSuggestButton("Target Audience")}
        </div>
        <Textarea
          id="audience"
          rows={3}
          className={fieldClass("audience")}
          placeholder="e.g., Amateur runners 25-40 who want pro-level gear"
          value={value.audience}
          onChange={(e) => set("audience", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vibe">Brand vibe</Label>
        <div className="relative">
          <Input
            id="vibe"
            className={`${fieldClass("vibe")} pr-10`}
            placeholder="e.g. Modern, Minimalist, Cyberpunk, Warm & Artisanal..."
            value={value.vibe}
            onChange={(e) => set("vibe", e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Generate vibe with AI"
            aria-label="Generate vibe with AI"
            onClick={safeHandler(handleGenerateVibe)}
            disabled={generatingVibe || suggestCooldown.cooling || loading}
            className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {generatingVibe ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto -mx-1 bg-background/80 px-1 pb-1 pt-3 backdrop-blur-xl">
        <Button
          type="submit"
          size="lg"
          disabled={loading || cooling}
          className="w-full font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Crafting Strategy…
            </>
          ) : (
            <>
              <Sparkles className="size-4" /> Generate Strategy
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
