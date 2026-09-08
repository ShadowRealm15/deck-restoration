import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import Confetti from "react-confetti";
import { Zap, Flame, Wind, ShoppingCart, Timer, Gauge } from "lucide-react";

const CONFETTI_COLORS = ["#FF2A5F", "#00F0FF", "#FFE600", "#FFFFFF"];
const SPRING = { type: "spring" as const, stiffness: 100, damping: 15 };

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const update = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

const letterVariants: Variants = {
  rest: { y: 0, scale: 1, rotate: 0, skewX: 0 },
  hover: {
    y: -18,
    scale: 1.35,
    rotate: -6,
    skewX: -8,
    transition: { type: "spring", stiffness: 500, damping: 10 },
  },
};

function KineticWord({
  word,
  className,
}: {
  word: string;
  className?: string;
}) {
  return (
    <span className={`inline-block whitespace-nowrap ${className ?? ""}`}>
      {word.split("").map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          className="inline-block origin-bottom cursor-pointer"
          variants={letterVariants}
          initial="rest"
          animate="rest"
          whileHover="hover"
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

function ScrollSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(scrollYProgress, [0, 0.4, 0.7, 1], [140, 0, 0, -140]);
  const y = useSpring(raw, SPRING);
  const scaleRaw = useTransform(
    scrollYProgress,
    [0, 0.35, 0.75, 1],
    [0.9, 1, 1, 0.94],
  );
  const scale = useSpring(scaleRaw, SPRING);

  return (
    <motion.section ref={ref} style={{ y, scale }} className={className}>
      {children}
    </motion.section>
  );
}

function PopArtShoe() {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neon-yellow">
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6">
        <div className="col-span-4 row-span-2 bg-neon-cyan" />
        <div className="col-span-2 row-span-6 bg-void" />
        <div className="col-span-4 row-span-3 bg-neon-pink" />
      </div>
      <motion.div
        className="absolute inset-x-6 bottom-10 h-24 rounded-l-full rounded-tr-[6rem] bg-void shadow-[12px_12px_0_0_#00F0FF]"
        animate={{ rotate: [-3, 3, -3], x: [-6, 6, -6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute left-8 top-5 h-3 w-28 -rotate-6 rounded-full bg-neon-yellow" />
        <div className="absolute left-10 top-11 h-3 w-24 -rotate-6 rounded-full bg-neon-pink" />
        <div className="absolute bottom-0 left-0 h-5 w-full rounded-b-full bg-neon-cyan" />
      </motion.div>
      <span className="absolute left-4 top-4 rounded-full bg-void px-3 py-1 text-xs font-black tracking-[0.2em] text-neon-yellow">
        AIR/FLUX 01
      </span>
    </div>
  );
}

function DropPage() {
  const { width, height } = useWindowSize();
  const [blast, setBlast] = useState(0);
  const [firing, setFiring] = useState(false);

  useEffect(() => {
    if (!blast) return;
    const t = setTimeout(() => setBlast(0), 6000);
    return () => clearTimeout(t);
  }, [blast]);

  const fire = () => {
    setBlast(Date.now());
    setFiring(true);
    setTimeout(() => setFiring(false), 450);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-void-deep text-white selection:bg-neon-pink">
      {blast > 0 && width > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50">
          <Confetti
            key={blast}
            width={width}
            height={height}
            numberOfPieces={900}
            recycle={false}
            gravity={0.35}
            colors={CONFETTI_COLORS}
          />
        </div>
      )}

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col justify-center px-5 py-24 sm:px-10">
        <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-neon-pink/30 blur-[120px]" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-neon-cyan/25 blur-[140px]" />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.4em] text-neon-cyan"
        >
          <Zap className="h-4 w-4" /> Drop 00 / Technicolor Hedonism
        </motion.p>

        <h1 className="max-w-6xl text-[clamp(2.6rem,11vw,9rem)] font-black uppercase leading-[0.85] tracking-tighter">
          <KineticWord word="Stop" className="text-white" />{" "}
          <KineticWord word="suffering." className="text-neon-pink" />
          <br />
          <KineticWord word="Start" className="text-white" />{" "}
          <KineticWord word="soaring." className="text-neon-cyan" />
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 max-w-xl text-lg font-medium text-white/70"
        >
          A running shoe built for people who hate running shoe ads. Loud foam,
          absurd rebound, zero moody sunrise footage.
        </motion.p>

        <div className="mt-10 flex flex-wrap gap-3">
          {[
            { icon: Flame, label: "112% rebound" },
            { icon: Wind, name: "", label: "168g featherweight" },
            { icon: Gauge, label: "Carbon flux plate" },
          ].map(({ icon: Icon, label }) => (
            <motion.span
              key={label}
              whileHover={{ scale: 1.08, rotate: -2 }}
              transition={SPRING}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-neon-yellow"
            >
              <Icon className="h-4 w-4" /> {label}
            </motion.span>
          ))}
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y-4 border-neon-yellow bg-neon-pink py-3">
        <motion.div
          className="flex whitespace-nowrap text-2xl font-black uppercase tracking-tight text-void-deep sm:text-4xl"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex">
              {Array.from({ length: 6 }).map((__, j) => (
                <span key={j} className="px-6">
                  RUN LOUD ★ FEEL EVERYTHING ★
                </span>
              ))}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Product */}
      <ScrollSection className="px-5 py-24 sm:px-10">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <motion.div
            whileHover={{ rotate: -1.5, scale: 1.02 }}
            transition={SPRING}
            className="rounded-3xl border border-white/10 bg-white p-6 text-void-deep shadow-[0_0_80px_-20px_#FF2A5F]"
          >
            <PopArtShoe />
            <div className="mt-6 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight">
                  Nike Air Flux
                </h2>
                <p className="text-sm font-semibold text-void/60">
                  Hyper-rebound daily trainer
                </p>
              </div>
              <span className="text-3xl font-black">$189</span>
            </div>

            <motion.button
              type="button"
              onClick={fire}
              animate={firing ? { scale: [1, 1.18, 0.94, 1] } : { scale: 1 }}
              transition={SPRING}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-neon-pink px-6 py-5 text-lg font-black uppercase tracking-widest text-white shadow-[0_0_40px_-4px_#FF2A5F] outline-none focus-visible:ring-4 focus-visible:ring-neon-cyan"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to cart
            </motion.button>
            <p className="mt-3 text-center text-xs font-bold uppercase tracking-[0.25em] text-void/50">
              Warning: triggers confetti
            </p>
          </motion.div>

          <div className="space-y-6">
            <h3 className="text-[clamp(2rem,6vw,4rem)] font-black uppercase leading-[0.9] tracking-tighter text-neon-yellow">
              Built to make
              <br />
              <span className="text-neon-cyan">boring miles</span> illegal.
            </h3>
            <p className="text-lg text-white/70">
              Every panel is a color riot. Every stride is a spring launch. The
              Flux plate returns energy so fast your watch will file a
              complaint.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Timer, k: "-42s", v: "avg 5K delta" },
                { icon: Flame, k: "9/10", v: "disruption index" },
              ].map(({ icon: Icon, k, v }) => (
                <div
                  key={k}
                  className="rounded-2xl border border-neon-cyan/30 bg-neon-cyan/5 p-5"
                >
                  <Icon className="mb-3 h-5 w-5 text-neon-cyan" />
                  <p className="text-3xl font-black">{k}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                    {v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Manifesto */}
      <ScrollSection className="px-5 pb-32 sm:px-10">
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-3">
          {[
            {
              t: "No moody sunrises",
              d: "We swapped the fog machine for floodlights.",
              c: "bg-neon-pink text-void-deep",
            },
            {
              t: "No suffering quotes",
              d: "Pain is not a personality. Speed is.",
              c: "bg-neon-cyan text-void-deep",
            },
            {
              t: "No quiet colorways",
              d: "If it doesn't glow, it doesn't go.",
              c: "bg-neon-yellow text-void-deep",
            },
          ].map((card) => (
            <motion.div
              key={card.t}
              whileHover={{ y: -12, rotate: 1.5 }}
              transition={SPRING}
              className={`rounded-3xl p-7 ${card.c}`}
            >
              <h4 className="text-2xl font-black uppercase leading-tight tracking-tight">
                {card.t}
              </h4>
              <p className="mt-3 font-semibold opacity-80">{card.d}</p>
            </motion.div>
          ))}
        </div>
      </ScrollSection>
    </main>
  );
}

export const Route = createFileRoute("/drop")({
  component: DropPage,
  head: () => ({
    meta: [
      { title: "Nike Air Flux — Stop Suffering. Start Soaring." },
      {
        name: "description",
        content:
          "The Nike Air Flux drop: hyper-rebound foam, carbon flux plate, and a technicolor campaign built for runners who hate boring miles.",
      },
      { property: "og:title", content: "Nike Air Flux — Start Soaring" },
      {
        property: "og:description",
        content:
          "Hyper-rebound daily trainer in a neon, anti-corporate campaign. Drop 00 is live.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
