/** Module illustrations (blob + stroke), matching the suite's design. */
type Props = { className?: string };

export function EarArt({ className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/images/ear.png" alt="" aria-hidden className={`object-contain select-none ${className ?? ""}`} />
  );
}

export function MouthArt({ className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/images/mouth.png" alt="" aria-hidden className={`object-contain select-none ${className ?? ""}`} />
  );
}

export function RhythmArt({ className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/images/rhythm.png" alt="" aria-hidden className={`object-contain select-none ${className ?? ""}`} />
  );
}

/** Bar chart in the suite's violet; there is no raster art for this module. */
export function StatsArt({ className }: Props) {
  return (
    <svg viewBox="0 0 200 160" aria-hidden className={`select-none ${className ?? ""}`}>
      <g strokeLinecap="round" strokeLinejoin="round">
        <rect x="28" y="92" width="34" height="52" rx="10" fill="#c4b5fd" stroke="#6d4fd1" strokeWidth="5" />
        <rect x="83" y="58" width="34" height="86" rx="10" fill="#a78bfa" stroke="#6d4fd1" strokeWidth="5" />
        <rect x="138" y="24" width="34" height="120" rx="10" fill="#8b5cf6" stroke="#6d4fd1" strokeWidth="5" />
        <path d="M20 148h160" fill="none" stroke="#6d4fd1" strokeWidth="5" />
      </g>
    </svg>
  );
}
