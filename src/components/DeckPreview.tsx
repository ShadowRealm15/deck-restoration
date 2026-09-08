import { motion } from "framer-motion";
import {
  LayoutGrid,
  Users,
  Crosshair,
  Quote,
  Palette,
  Wand2,
  ListChecks,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AutoTextarea } from "@/components/AutoTextarea";
import { VisualIdentitySection } from "@/components/VisualIdentitySection";
import { isDeckEmpty, type DeckField, type StrategyDeck } from "@/lib/brand-strategy";

type Props = {
  deck: StrategyDeck;
  onChange: (next: StrategyDeck) => void;
  onRewrite: (field: DeckField) => void;
  rewriting: DeckField | null;
  loading: boolean;
  brandName: string;
  presenting?: boolean;
  /** Renders a fixed desktop bento layout for the off-screen PDF capture clone. */
  forPdf?: boolean;
};

function fieldText(deck: StrategyDeck, field: DeckField): string {
  switch (field) {
    case "executiveSummary":
      return deck?.executiveSummary || "";
    case "audienceEmpathy":
      return `Current pain: ${deck?.audienceEmpathy?.pain || ""}\nSecret dream: ${deck?.audienceEmpathy?.dream || ""}`;
    case "strategicPositioning":
      return deck?.strategicPositioning || "";
    case "heroMessaging":
      return (deck?.heroMessaging || []).map((h) => `• ${h}`).join("\n");
    case "visualIdentity":
      return [
        `Colors: ${(deck?.visualIdentity?.hexColors || []).join(", ")}`,
        `Display font: ${deck?.visualIdentity?.typography?.display || "—"}`,
        `Body font: ${deck?.visualIdentity?.typography?.body || "—"}`,
        `Art direction: ${deck?.visualIdentity?.artDirection || "—"}`,
        ...(deck?.visualIdentity?.toneSliders || []).map((s) => `${s?.name || "Tone"}: ${s?.value ?? 5}/10`),
      ].join("\n");
    case "actionPlan":
      return (deck?.actionPlan || []).map((s, i) => `${i + 1}. ${s}`).join("\n");
    default:
      return "";
  }
}

function CardShell({
  title,
  icon,
  className,
  children,
  index,
  field,
  onRewrite,
  rewriting,
  onCopy,
  forPdf,
}: {
  title: string;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  index: number;
  field: DeckField;
  onRewrite: (field: DeckField) => void;
  rewriting: DeckField | null;
  onCopy: (field: DeckField, title: string) => void;
  forPdf?: boolean;
}) {
  const busy = rewriting === field;
  const [copied, setCopied] = useState(false);
  return (
    <motion.section
      data-deck-card={field}
      initial={forPdf ? false : { opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      className={
        forPdf
          ? `deck-card group relative flex h-full min-h-0 flex-col break-inside-avoid overflow-hidden rounded-xl border border-gray-800/60 p-5 ${className ?? ""}`
          : `glass-panel deck-card group relative break-inside-avoid rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_18px_45px_-18px_color-mix(in_oklab,var(--accent)_45%,transparent)] sm:p-6 ${className ?? ""}`
      }
    >
      <header className="mb-4 flex items-start gap-2">
        <span
          className={
            forPdf
              ? "grid size-7 shrink-0 place-items-center rounded-lg border border-gray-800/60 text-emerald-400"
              : "grid size-7 shrink-0 place-items-center rounded-lg bg-glass text-primary"
          }
        >
          {icon}
        </span>
        <h3
          className={
            forPdf
              ? "min-w-0 flex-1 break-words text-[15px] font-bold uppercase tracking-wider text-emerald-400"
              : "min-w-0 flex-1 break-words text-xs font-bold uppercase tracking-wider text-foreground sm:text-sm"
          }
        >
          {title}
        </h3>
      </header>

      <div className="no-print absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-all focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          aria-label={`Copy ${title}`}
          title={`Copy ${title}`}
          onClick={() => {
            onCopy(field, title);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
          className="inline-flex items-center rounded-full border border-glass-border bg-glass p-1.5 text-muted-foreground transition-colors hover:text-primary"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </button>
        <button
          type="button"
          aria-label={`Rewrite ${title}`}
          title={`Rewrite ${title}`}
          onClick={() => onRewrite(field)}
          disabled={rewriting !== null}
          className="inline-flex items-center gap-1 rounded-full border border-glass-border bg-glass px-2.5 py-1 text-[0.7rem] text-muted-foreground transition-colors hover:text-accent disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 className="size-3 animate-spin" /> : <Wand2 className="size-3" />}
          Rewrite
        </button>
      </div>
      <div
        className={`${forPdf ? "flex-1" : ""} ${busy ? "pointer-events-none opacity-50" : ""}`}
      >
        {children}
      </div>
    </motion.section>
  );
}

function DeckSkeleton() {
  const spans = [
    "md:col-span-2",
    "",
    "",
    "md:col-span-2",
    "",
    "",
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {spans.map((span, i) => (
        <div
          key={i}
          className={`glass-panel rounded-2xl p-5 sm:p-6 ${span}`}
          aria-hidden
        >
          <div className="mb-5 flex items-center gap-2">
            <Skeleton className="size-7 rounded-lg" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-[78%]" />
            {i % 3 === 0 && <Skeleton className="h-4 w-[60%]" />}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DeckPreview({
  deck,
  onChange,
  onRewrite,
  rewriting,
  loading,
  brandName,
  presenting,
  forPdf = false,
}: Props) {
  const handleCardCopy = async (field: DeckField, title: string) => {
    try {
      await navigator.clipboard.writeText(`${title.toUpperCase()}\n${fieldText(deck, field)}`);
      toast.success(`${title} copied to clipboard`);
    } catch {
      toast.error("Could not copy that section");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Drafting a full brand strategy deck…
        </p>
        <DeckSkeleton />
      </div>
    );
  }

  if (isDeckEmpty(deck)) {
    return (
      <div className="glass-panel flex min-h-[55vh] flex-col items-center justify-center gap-3 rounded-2xl px-6 text-center text-muted-foreground">
        <LayoutGrid className="size-7" />
        <p className="max-w-xs text-sm leading-relaxed">
          Your strategy dashboard appears here. Fill in the brief for
          {brandName ? ` ${brandName}` : " your client"} and generate the strategy.
        </p>
      </div>
    );
  }

  // Bulletproof data bindings: optional chaining + safe fallbacks so the UI
  // never crashes when the AI response is missing a key.
  const executiveSummary =
    deck?.executiveSummary || "Drafting the executive summary...";
  const painPoint =
    deck?.audienceEmpathy?.pain || "Analyzing audience pain points...";
  const dreamState =
    deck?.audienceEmpathy?.dream || "Formulating ideal outcomes...";
  const strategicPositioning =
    deck?.strategicPositioning || "Defining the strategic position...";
  const heroHooks =
    deck?.heroMessaging?.length ? deck.heroMessaging : ["Crafting hero messaging..."];
  const actionSteps =
    deck?.actionPlan?.length ? deck.actionPlan : ["Building the action plan..."];

  const setList = (field: "heroMessaging" | "actionPlan", i: number, value: string) => {
    const next = [...(deck?.[field] || [])];
    next[i] = value;
    onChange({ ...deck, [field]: next });
  };

  const spanFull = forPdf ? "col-span-2" : "md:col-span-2";

  const header = forPdf ? (
    <div
      data-deck-header
      className="mb-2 flex w-full items-center justify-between border-b border-gray-800 pb-4"
    >
      <span className="text-2xl font-bold tracking-wide text-[#f8fafc]">
        {brandName || "Client"} — Strategic Deck Framework
      </span>
      <span className="text-base font-medium text-gray-400">Prepared by BrandStrat AI</span>
    </div>
  ) : (
    <div
      data-deck-header
      className="md:col-span-2 flex flex-wrap items-center justify-between gap-2 border-b border-glass-border pb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground"
    >
      <span className="text-sm font-bold tracking-[0.14em] text-foreground">
        {brandName || "Client"} — Strategic Deck Framework
      </span>
      <span className="text-[0.7rem]">Prepared by BrandStrat AI</span>
    </div>
  );

  const executiveSummaryCard = (
    <CardShell
      key="executiveSummary"
      index={0}
      title="Executive Summary"
      icon={<LayoutGrid className="size-4" />}
      className={spanFull}
      field="executiveSummary"
      onRewrite={onRewrite}
      rewriting={rewriting}
      onCopy={handleCardCopy}
      forPdf={forPdf}
    >
      <AutoTextarea
        ariaLabel="Executive summary"
        value={executiveSummary}
        onChange={(v) => onChange({ ...deck, executiveSummary: v })}
        className={
          forPdf
            ? "px-2 py-1 text-[17px] leading-[1.6] text-foreground"
            : "px-2 py-1 font-serif text-lg leading-relaxed text-foreground sm:text-[1.55rem] sm:leading-[1.55]"
        }
      />
    </CardShell>
  );

  const audienceEmpathyCard = (
    <CardShell
      key="audienceEmpathy"
      index={1}
      title="Audience Empathy"
      icon={<Users className="size-4" />}
      field="audienceEmpathy"
      onRewrite={onRewrite}
      rewriting={rewriting}
      onCopy={handleCardCopy}
      forPdf={forPdf}
    >
      <div className="space-y-4">
        {(["pain", "dream"] as const).map((key) => (
          <div key={key}>
            <p
              className={
                forPdf
                  ? "mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"
                  : "mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary"
              }
            >
              {key === "pain" ? "Current pain" : "Secret dream"}
            </p>
            <AutoTextarea
              ariaLabel={`Audience ${key}`}
              value={key === "pain" ? painPoint : dreamState}
              onChange={(v) =>
                onChange({
                  ...deck,
                  audienceEmpathy: { ...deck.audienceEmpathy, [key]: v },
                })
              }
              className={
                forPdf
                  ? "px-2 py-1 text-[16px] leading-[1.6] text-muted-foreground"
                  : "px-2 py-1 text-sm leading-loose text-muted-foreground"
              }
            />
          </div>
        ))}
      </div>
    </CardShell>
  );

  const strategicPositioningCard = (
    <CardShell
      key="strategicPositioning"
      index={2}
      title="Strategic Positioning"
      icon={<Crosshair className="size-4" />}
      field="strategicPositioning"
      onRewrite={onRewrite}
      rewriting={rewriting}
      onCopy={handleCardCopy}
      forPdf={forPdf}
    >
      <AutoTextarea
        ariaLabel="Strategic positioning"
        value={strategicPositioning}
        onChange={(v) => onChange({ ...deck, strategicPositioning: v })}
        className={
          forPdf
            ? "px-2 py-1 text-[16px] leading-[1.6] text-muted-foreground"
            : "px-2 py-1 text-sm leading-loose text-muted-foreground"
        }
      />
    </CardShell>
  );

  const heroMessagingCard = (
    <CardShell
      key="heroMessaging"
      index={3}
      title="Hero Messaging"
      icon={<Quote className="size-4" />}
      className={forPdf ? `${spanFull} !p-6` : spanFull}

      field="heroMessaging"
      onRewrite={onRewrite}
      rewriting={rewriting}
      onCopy={handleCardCopy}
      forPdf={forPdf}
    >
      <div className={forPdf ? "flex h-full flex-col justify-between gap-3" : "space-y-3"}>
        {heroHooks.length ? (
          heroHooks.map((hook, i) => (
            <blockquote
              key={i}
              className={
                forPdf
                  ? "relative flex-1 break-inside-avoid rounded-xl border border-gray-800/60 px-4 py-2 pl-11"
                  : "relative break-inside-avoid rounded-xl border border-glass-border bg-glass px-4 py-4 pl-10 sm:px-5 sm:pl-11"
              }
            >
              <span
                aria-hidden
                className={
                  forPdf
                    ? "absolute left-5 top-3 font-serif text-4xl leading-none text-primary/70"
                    : "absolute left-3 top-1 font-serif text-4xl leading-none text-primary/70"
                }
              >
                “
              </span>
              <AutoTextarea
                ariaLabel={`Hero hook ${i + 1}`}
                value={hook || ""}
                onChange={(v) => setList("heroMessaging", i, v)}
                className={
                  forPdf
                    ? "text-[21px] font-semibold leading-snug text-foreground"
                    : "font-serif text-base leading-relaxed text-foreground sm:text-lg"
                }
              />
            </blockquote>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </div>
    </CardShell>
  );

  const visualIdentityCard = (
    <CardShell
      key="visualIdentity"
      index={4}
      title="Visual Identity & Tone"
      icon={<Palette className="size-4" />}
      field="visualIdentity"
      onRewrite={onRewrite}
      rewriting={rewriting}
      onCopy={handleCardCopy}
      forPdf={forPdf}
    >
      <VisualIdentitySection visualIdentity={deck?.visualIdentity} forPdf={forPdf} />
    </CardShell>
  );

  const actionPlanCard = (
    <CardShell
      key="actionPlan"
      index={5}
      title="Action Plan"
      icon={<ListChecks className="size-4" />}
      field="actionPlan"
      onRewrite={onRewrite}
      rewriting={rewriting}
      onCopy={handleCardCopy}
      forPdf={forPdf}
    >
      <ol className={forPdf ? "flex h-full min-h-0 flex-col justify-between gap-3" : "grid gap-3"}>
        {actionSteps.map((step, i) => (
          <li
            key={i}
            className={
              forPdf
                ? "flex-1 break-inside-avoid overflow-hidden rounded-xl border border-gray-800/60 p-4 text-[16px] leading-relaxed text-muted-foreground"
                : "break-inside-avoid rounded-xl border border-glass-border bg-glass p-4 text-sm leading-loose text-muted-foreground"
            }
          >
            <span
              className={
                forPdf
                  ? "mb-2 inline-grid size-8 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-[15px] font-semibold text-primary-foreground"
                  : "mb-2 inline-grid size-6 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-xs font-semibold text-primary-foreground"
              }
            >
              {i + 1}
            </span>
            <AutoTextarea
              ariaLabel={`Action step ${i + 1}`}
              value={step || ""}
              onChange={(v) => setList("actionPlan", i, v)}
              className={
                forPdf
                  ? "text-[16px] leading-relaxed text-muted-foreground"
                  : "text-sm leading-loose text-muted-foreground"
              }
            />
          </li>
        ))}
      </ol>
    </CardShell>
  );

  /*
   * PDF path: two rigidly grouped page wrappers. Each `[data-deck-page]` node is
   * captured as ONE image and placed on exactly one A4 page, so no card can ever
   * be bisected by a page break.
   *   Page 1 — Executive Summary, Audience Empathy, Strategic Positioning
   *   Page 2 — Hero Messaging, Visual Identity & Tone, Action Plan
   */
  if (forPdf) {
    // Strict non-collapsible 794x1123 A4 portrait page — matches jsPDF 1:1.
    const pageStyle: React.CSSProperties = {
      width: "794px",
      minWidth: "794px",
      maxWidth: "794px",
      height: "1123px",
      minHeight: "1123px",
      maxHeight: "1123px",
      boxSizing: "border-box",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      gap: "32px",
      padding: "48px",
      backgroundColor: "#0d0e11",
      color: "#f8fafc",
    };
    const gridStyle: React.CSSProperties = {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
      flex: 1,
      minWidth: 0,
      minHeight: 0,
    };
    return (
      <div className="flex flex-col gap-12">
        <section
          id="pdf-page-1-wrapper"
          data-deck-page="1"
          className="box-border overflow-hidden"
          style={pageStyle}
        >
          {header}
          <div className="flex flex-col">{executiveSummaryCard}</div>
          <div style={gridStyle}>
            {audienceEmpathyCard}
            {strategicPositioningCard}
          </div>
        </section>
        <section
          id="pdf-page-2-wrapper"
          data-deck-page="2"
          className="box-border overflow-hidden"
          style={pageStyle}
        >
          {header}
          <div className="flex flex-col">{heroMessagingCard}</div>
          <div style={gridStyle}>
            {visualIdentityCard}
            {actionPlanCard}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${presenting ? "md:gap-5" : ""}`}
    >
      {header}
      {executiveSummaryCard}
      {audienceEmpathyCard}
      {strategicPositioningCard}
      {heroMessagingCard}
      {visualIdentityCard}
      {actionPlanCard}
    </div>
  );
}

