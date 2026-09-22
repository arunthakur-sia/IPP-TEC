import Image from "next/image";

/**
 * Brand lockup for the top nav: the official TEC mark plus the SIA
 * co-brand mark from public/brand, separated by a divider. Swap either
 * asset by replacing the file at that path — dimensions below match
 * each SVG's native aspect ratio so next/image never distorts them.
 */
export function TecWordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <Image src="/brand/tec-logo.svg" alt="TEC" width={169} height={65} priority className="h-8 w-auto sm:h-9" />
      <span className="h-6 w-px shrink-0 bg-border" aria-hidden />
      <Image src="/brand/sia-logo.svg" alt="SIA" width={54} height={15} className="h-4 w-auto opacity-90 sm:h-[18px]" />
      <span className="hidden flex-col leading-none border-s border-border ps-3 md:flex">
        <span className="text-sm font-semibold text-ink-900">Innovation</span>
        <span className="text-[11px] text-ink-500">Professional Program</span>
      </span>
    </span>
  );
}
