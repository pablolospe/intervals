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
