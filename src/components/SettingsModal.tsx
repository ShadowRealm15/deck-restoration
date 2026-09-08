import { useEffect, useState } from "react";
import { Settings, KeyRound, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { loadApiKey, saveApiKey } from "@/lib/brand-strategy";

export function SettingsModal({ onSaved }: { onSaved: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue(loadApiKey());
  }, [open]);

  const save = () => {
    saveApiKey(value);
    onSaved(value.trim());
    setOpen(false);
    toast.success(value.trim() ? "API key saved to this browser" : "API key removed");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Settings"
          className="rounded-full border border-glass-border bg-glass text-muted-foreground hover:text-foreground"
        >
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border-glass-border bg-card/95 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            The Brain
          </DialogTitle>
          <DialogDescription>
            Your Gemini API key is stored only in this browser's local storage and sent directly to
            Google.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="api-key">Gemini API Key</Label>
          <Input
            id="api-key"
            type="password"
            autoComplete="off"
            placeholder="AIza..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="border-glass-border bg-background/60"
          />
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Get a key from Google AI Studio <ExternalLink className="size-3" />
          </a>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
