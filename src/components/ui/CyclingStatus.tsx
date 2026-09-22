"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Cycles through a list of status lines with a brief cross-fade, so a wait
 * that can genuinely take up to a minute (several sequential model calls)
 * reads as active progress rather than a frozen screen. Purely cosmetic —
 * the steps are not tied to real server-side progress, since the backend
 * returns one response at the end rather than streaming stage updates.
 */
export function CyclingStatus({ messages, intervalMs = 3200, className }: { messages: string[]; intervalMs?: number; className?: string }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (messages.length <= 1) return;

    let fadeTimeout: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setVisible(false);
      fadeTimeout = setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 200);
    }, intervalMs);

    return () => {
      clearInterval(id);
      clearTimeout(fadeTimeout);
    };
  }, [messages, intervalMs]);

  return (
    <span className={cn("inline-block transition-opacity duration-200", visible ? "opacity-100" : "opacity-0", className)}>
      {messages[index % messages.length]}
    </span>
  );
}
