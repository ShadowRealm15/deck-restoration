import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PASSWORD = "BRANDSTRAT482";

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() === PASSWORD) {
      onUnlock();
      return;
    }
    setError(true);
  };

  return (
    <div className="shell-gradient flex min-h-screen items-center justify-center bg-background px-5">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-2xl border border-glass-border bg-glass p-7 backdrop-blur-xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">
              BrandStrat <span className="text-gradient-primary">AI</span>
            </h1>
            <p className="text-xs text-muted-foreground">Private workspace</p>
          </div>
        </div>

        <label htmlFor="site-password" className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Lock className="size-3.5 text-primary" />
          Enter password
        </label>
        <Input
          id="site-password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          placeholder="••••••••••"
          className="border-glass-border bg-background/60"
        />
        {error && <p className="mt-2 text-xs text-destructive">Incorrect password. Try again.</p>}

        <Button type="submit" className="mt-5 w-full">
          Unlock workspace
          <ArrowRight className="size-4" />
        </Button>
      </motion.form>
    </div>
  );
}
