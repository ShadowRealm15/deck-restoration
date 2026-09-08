import { motion } from "framer-motion";
import { CaseSensitive, Paintbrush, Type } from "lucide-react";
import type { ToneSlider } from "@/lib/brand-strategy";

type VisualIdentity = {
  hexColors: string[];
  toneSliders: ToneSlider[];
  typography: { display: string; body: string };
  artDirection: string;
};

type Props = {
  visualIdentity: VisualIdentity;
  forPdf?: boolean;
};

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeOutExpo,
    },
  },
};

function ColorSwatch({ hex, label, index }: { hex: string; label: string; index: number }) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center gap-2"
      style={{ willChange: "transform, opacity" }}
    >
      <div
        className="size-14 rounded-full shadow-lg ring-2 ring-white/10 transition-transform duration-300 hover:scale-110"
        style={{ backgroundColor: hex }}
        aria-label={`Color swatch ${label}`}
      />
      <code className="text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
        {hex}
      </code>
    </motion.div>
  );
}

function ToneSliderBar({ slider, index }: { slider: ToneSlider; index: number }) {
  const percentage = Math.min(100, Math.max(0, (slider.value / 10) * 100));
  return (
    <motion.div variants={itemVariants} className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{slider.name}</span>
        <span className="font-mono text-[0.7rem] text-muted-foreground">
          {slider.value}/10
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: 0.2 + index * 0.08, ease: easeOutExpo }}
          className="h-full rounded-full bg-[image:var(--gradient-tone)]"
          aria-valuenow={slider.value}
          aria-valuemin={0}
          aria-valuemax={10}
          role="progressbar"
        />
      </div>
    </motion.div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  fallback,
  forPdf,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  fallback: string;
  forPdf?: boolean;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className={
        forPdf
          ? "rounded-xl border border-gray-800/60 bg-white/[0.03] p-4"
          : "rounded-xl border border-glass-border bg-white/5 p-4 backdrop-blur-md transition-colors hover:bg-white/[0.07]"
      }
    >
      <div className="mb-2 flex items-center gap-2 text-primary">
        {icon}
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em]">
          {label}
        </span>
      </div>
      <p
        className={
          forPdf
            ? "whitespace-pre-line text-[15px] leading-snug text-foreground"
            : "whitespace-pre-line text-sm leading-snug text-foreground"
        }
      >
        {value?.trim() ? value : fallback}
      </p>
    </motion.div>
  );
}

export function VisualIdentitySection({ visualIdentity, forPdf = false }: Props) {
  const colors = visualIdentity?.hexColors?.length
    ? visualIdentity.hexColors
    : ["#333333", "#666666", "#999999"];

  const sliders = visualIdentity?.toneSliders?.length
    ? visualIdentity.toneSliders
    : [
        { name: "Serious to Playful", value: 5 },
        { name: "Understated to Loud", value: 5 },
        { name: "Traditional to Avant-Garde", value: 5 },
      ];

  const displayFont = visualIdentity?.typography?.display || "Awaiting Display Font";
  const bodyFont = visualIdentity?.typography?.body || "Awaiting Body Font";
  const artDirection = visualIdentity?.artDirection || "Awaiting Art Direction";

  return (
    <div className={forPdf ? "visual-identity-section space-y-5" : "visual-identity-section space-y-6"}>
      {!forPdf && (
        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: easeOutExpo }}
          className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-primary"
        >
          Visual Identity
        </motion.h3>
      )}

      {/* Color Swatches */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap items-start gap-5"
      >
        {colors.map((hex, i) => (
          <ColorSwatch key={`${hex}-${i}`} hex={hex} label={hex} index={i} />
        ))}
      </motion.div>

      {/* Typography & Art Direction */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <InfoCard
          icon={<Type className="size-4" />}
          label="Typography"
          value={`Display: ${displayFont}\nBody: ${bodyFont}`}
          fallback="Awaiting Typography"
          forPdf={forPdf}
        />
        <InfoCard
          icon={<Paintbrush className="size-4" />}
          label="Art Direction"
          value={artDirection}
          fallback="Awaiting Art Direction"
          forPdf={forPdf}
        />
      </motion.div>

      {/* Tone Sliders */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <div className="flex items-center gap-2 text-primary">
          <CaseSensitive className="size-4" />
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em]">
            Tone Sliders
          </span>
        </div>
        <div className="space-y-3">
          {sliders.map((slider, i) => (
            <ToneSliderBar key={`${slider.name}-${i}`} slider={slider} index={i} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
