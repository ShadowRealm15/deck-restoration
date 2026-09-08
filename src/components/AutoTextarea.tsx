import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  ariaLabel: string;
};

/** Seamless auto-resizing textarea used for in-place editing of deck copy. */
export function AutoTextarea({ value, onChange, className, placeholder, ariaLabel }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      aria-label={ariaLabel}
      value={value}
      placeholder={placeholder}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      className={`h-auto max-h-none w-full resize-none overflow-hidden rounded-lg border border-transparent bg-transparent outline-none transition-colors hover:border-glass-border focus:border-glass-border focus:bg-glass ${className ?? ""}`}
    />
  );
}
