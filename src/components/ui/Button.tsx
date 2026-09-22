"use client";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent-500 text-white shadow-sm shadow-accent-500/20 hover:bg-accent-600 active:bg-accent-700 disabled:bg-accent-300 disabled:shadow-none",
  secondary:
    "bg-surface text-ink-800 border border-border shadow-sm hover:bg-muted hover:border-ink-400/40 disabled:text-ink-400 disabled:hover:bg-surface",
  ghost: "text-ink-700 hover:bg-muted disabled:text-ink-400 disabled:hover:bg-transparent",
  danger:
    "bg-verdict-pivot text-white shadow-sm hover:opacity-90 active:opacity-80 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
