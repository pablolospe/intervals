/** Module illustrations (blob + stroke), matching the suite's design. */
type Props = { className?: string };

export function EarArt({ className }: Props) {
  return (
    <svg viewBox="0 0 240 200" aria-hidden className={className} fill="none">
      <defs>
    <linearGradient id="ear.blobGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#157f78"/><stop offset="1" stopColor="#0a4d4c"/></linearGradient>
    <linearGradient id="ear.skinGrad" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stopColor="#fde8d4"/><stop offset="1" stopColor="#f5cba8"/></linearGradient>
  </defs>
  <g id="ear.blob">
    <path id="ear.blobShape" d="M50 118C32 86 44 46 84 34C116 25 146 38 152 68C157 92 140 104 134 124C128 146 120 166 98 174C74 182 56 160 50 118Z" fill="url(#ear.blobGrad)"/>
    <path id="ear.stem" d="M78 150c-4 14-12 28-24 38M54 176c-6-4-12-4-16 0" stroke="#14b8b0" strokeWidth="2.5" strokeLinecap="round" opacity=".8"/>
  </g>
  <g id="ear.body" strokeLinejoin="round" strokeLinecap="round">
    <path id="ear.outer" d="M120 178c-24 0-34-20-30-44 4-24-4-46 8-72 11-26 44-36 68-22 26 15 30 48 16 72-10 18-26 28-30 44-3 12-12 22-32 22z" fill="url(#ear.skinGrad)"/>
    <path id="ear.helix" d="M118 76c10-18 38-18 46 2 7 18-4 32-14 44" stroke="#1a1a1f" strokeWidth="3.5" fill="none"/>
    <path id="ear.antihelix" d="M116 98c-6-12 2-22 12-22" stroke="#1a1a1f" strokeWidth="3.5" fill="none"/>
    <path id="ear.concha" d="M124 114c-6 10 2 24 16 22 6-1 10-4 12-8l-8-10c-4-6-14-10-20-4z" fill="#eebd9a" stroke="#1a1a1f" strokeWidth="3"/>
    <path id="ear.tragus" d="M102 120c-8-2-10 10-4 16 5 4 12 2 12-4" stroke="#1a1a1f" strokeWidth="3.5" fill="none"/>
    <path id="ear.lobeShade" d="M112 168c8 6 22 6 30-4" stroke="#e6ac84" strokeWidth="4" fill="none" opacity=".7"/>
  </g>
  <path id="ear.blobOverlap" d="M94 62c-12 6-18 24-14 48 3 18 8 34 4 52 14-6 22-26 22-48 0-28-2-44-12-52z" fill="#0f6b66" opacity=".45"/>
  <g id="ear.waves" stroke="#14d6cc" strokeWidth="6" strokeLinecap="round">
    <path d="M194 56l16-10"/><path d="M200 86h22"/><path d="M194 116l16 10"/>
  </g>
    </svg>
  );
}

export function MouthArt({ className }: Props) {
  return (
    <svg viewBox="0 0 240 200" aria-hidden className={className} fill="none">
      <defs>
    <linearGradient id="mouth.blobGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e0615f"/><stop offset="1" stopColor="#a73a3c"/></linearGradient>
    <linearGradient id="mouth.lipGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff8f8b"/><stop offset="1" stopColor="#f0605e"/></linearGradient>
  </defs>
  <g id="mouth.blob">
    <path id="mouth.blobShape" d="M26 96C18 56 48 22 90 22c30 0 50 12 56 34c6 22-6 46-20 68c-14 22-42 34-70 26C34 142 30 116 26 96z" fill="url(#mouth.blobGrad)"/>
    <path id="mouth.curl" d="M60 168c-6 12-16 20-30 16c-8-3-8-14 0-16c8-2 12 6 6 10" stroke="#f4726f" strokeWidth="3" strokeLinecap="round"/>
  </g>
  <g id="mouth.lips" strokeLinejoin="round" strokeLinecap="round">
    <path id="mouth.cavity" d="M46 100c24-10 46-12 68-12s44 2 68 12c-2 36-28 62-68 62S48 136 46 100z" fill="#5e1824" stroke="#2a0d14" strokeWidth="3.5"/>
    <path id="mouth.tongue" d="M72 150c8-20 24-30 42-30s34 10 42 30c-12 8-26 12-42 12s-30-4-42-12z" fill="#ec6866"/>
    <path id="mouth.tongueLine" d="M114 132v18" stroke="#b83e44" strokeWidth="2.5"/>
    <path id="mouth.lower" d="M42 104c10 38 38 64 72 64s62-26 72-64c-12 10-38 36-72 36s-60-26-72-36z" fill="url(#mouth.lipGrad)" stroke="#2a0d14" strokeWidth="3.5"/>
    <path id="mouth.teethTop" d="M60 96c18-4 36-6 54-6s36 2 54 6c-2 8-8 12-16 14-12 3-26 3-38 3s-26 0-38-3c-8-2-14-6-16-14z" fill="#fff6ec"/>
    <path id="mouth.upper" d="M42 100c6-22 22-40 44-44 12-2 22 2 28 10 6-8 16-12 28-10 22 4 38 22 44 44-18-12-44-16-72-16s-54 4-72 16z" fill="url(#mouth.lipGrad)" stroke="#2a0d14" strokeWidth="3.5"/>
    <path id="mouth.sheen" d="M68 82c6-8 14-12 22-12" stroke="#ffc2bd" strokeWidth="3.5" opacity=".8"/>
    <path id="mouth.lowerSheen" d="M92 156c14 8 32 8 46 0" stroke="#ff9d99" strokeWidth="3.5" opacity=".7"/>
  </g>
  <g id="mouth.notes" fill="#fff6ec">
    <path id="mouth.note1" d="M202 30v40a13 10 0 1 1-8-9.2V24l26 8v8z"/>
    <path id="mouth.note2" d="M214 100v32a11 9 0 1 1-7-8.2V94l22 7v7z"/>
  </g>
    </svg>
  );
}

export function RhythmArt({ className }: Props) {
  return (
    <svg viewBox="0 0 240 200" aria-hidden className={className} fill="none">
      <defs>
    <linearGradient id="rhythm.blobGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd84f"/><stop offset="1" stopColor="#e8a41c"/></linearGradient>
    <radialGradient id="rhythm.glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffcf3f" stopOpacity=".55"/><stop offset="1" stopColor="#ffcf3f" stopOpacity="0"/></radialGradient>
  </defs>
  <ellipse id="rhythm.glowShape" cx="124" cy="100" rx="116" ry="92" fill="url(#rhythm.glow)"/>
  <g id="rhythm.blob">
    <path id="rhythm.blobShape" d="M30 108C22 62 58 26 108 26c42 0 76 18 84 50c8 34-8 66-48 78c-36 10-102 12-114-46z" fill="url(#rhythm.blobGrad)"/>
    <path id="rhythm.curl" d="M26 176c8-12 26-8 20 4c-5 8-18 2-9-8" stroke="#ffcf3f" strokeWidth="3" strokeLinecap="round"/>
  </g>
  <g id="rhythm.card" transform="rotate(-3 120 98)">
    <rect id="rhythm.cardShadow" x="60" y="52" width="130" height="98" rx="14" fill="#8a5a00" opacity=".3" transform="translate(5 6)"/>
    <rect id="rhythm.cardFace" x="60" y="52" width="130" height="98" rx="14" fill="#fff6ea" stroke="#1a1a1f" strokeWidth="3.5"/>
    <g id="rhythm.notes" fill="#1a1a1f">
      <ellipse id="rhythm.head1" cx="84" cy="124" rx="12" ry="9" transform="rotate(-20 84 124)"/>
      <ellipse id="rhythm.head2" cx="118" cy="114" rx="12" ry="9" transform="rotate(-20 118 114)"/>
      <ellipse id="rhythm.head3" cx="152" cy="124" rx="12" ry="9" transform="rotate(-20 152 124)"/>
      <path id="rhythm.stems" d="M93 122V76h5v46zM127 112V66h5v46zM161 122V76h5v46z"/>
      <path id="rhythm.beam" d="M93 74l39-10v10l-39 10z"/>
      <path id="rhythm.flag" d="M166 76c6 12 14 16 16 30c-7-6-12-8-16-8z"/>
    </g>
  </g>
  <g id="rhythm.sparks" stroke="#ffcf3f" strokeWidth="5.5" strokeLinecap="round">
    <path d="M204 34l-10 16"/><path d="M216 62l22-4"/><path d="M222 90l16 8"/>
  </g>
    </svg>
  );
}
