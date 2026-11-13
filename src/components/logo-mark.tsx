/** BurpEars mascot: a flexing, headband-wearing ear. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 220" aria-hidden className={className} fill="none">
      <defs>
    <linearGradient id="logo.skin" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stopColor="#fde8d4"/><stop offset="1" stopColor="#f3c4a0"/></linearGradient>
    <clipPath id="logo.earClip"><path d="M142 200c-28 0-42-22-36-50 5-26-4-48 10-78 14-30 54-40 80-22 28 18 32 54 14 82-12 20-30 30-36 48-4 12-12 20-32 20z"/></clipPath>
  </defs>
  <g id="logo.arm" stroke="#1a1a1f" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
    <path id="logo.armShape" d="M28 100h40c2 14 4 24 4 34c8-22 36-30 54-12l4 78H26c-12-30-8-70-2-100z" fill="url(#logo.skin)"/>
    <path id="logo.bicepLine" d="M96 134c-9 6-14 16-12 30" stroke="#e0a982" strokeWidth="5"/>
    <path id="logo.forearmLine" d="M44 130c-2 16-2 30 2 44" stroke="#e0a982" strokeWidth="4"/>
    <rect id="logo.fist" x="20" y="54" width="56" height="52" rx="16" fill="url(#logo.skin)"/>
    <path id="logo.fingers" d="M36 62v16M48 62v16M60 62v16" strokeWidth="4"/>
    <path id="logo.thumb" d="M22 84c-8 0-10 12-2 16 6 3 14 0 16-6" fill="url(#logo.skin)" strokeWidth="4"/>
  </g>
  <g id="logo.ear" strokeLinejoin="round" strokeLinecap="round">
    <path id="logo.earFill" d="M142 200c-28 0-42-22-36-50 5-26-4-48 10-78 14-30 54-40 80-22 28 18 32 54 14 82-12 20-30 30-36 48-4 12-12 20-32 20z" fill="url(#logo.skin)"/>
    <g clipPath="url(#logo.earClip)"><path id="logo.headband" d="M100 78c24-20 74-24 108 6l-4 22c-30-26-72-22-104 2z" fill="#14d6cc"/></g>
    <path id="logo.earOutline" d="M142 200c-28 0-42-22-36-50 5-26-4-48 10-78 14-30 54-40 80-22 28 18 32 54 14 82-12 20-30 30-36 48-4 12-12 20-32 20z" stroke="#1a1a1f" strokeWidth="5"/>
    <g clipPath="url(#logo.earClip)"><path id="logo.headbandEdges" d="M108 94c28-22 70-20 100 2M110 74c24-20 70-22 96 4" stroke="#1a1a1f" strokeWidth="3.5" opacity=".9"/></g>
    <path id="logo.helix" d="M138 128c-6-14 2-26 14-26" stroke="#1a1a1f" strokeWidth="4.5"/>
    <path id="logo.helix2" d="M148 122c14-22 38-10 42 8 3 14-6 26-14 38" stroke="#1a1a1f" strokeWidth="4.5"/>
    <path id="logo.concha" d="M150 146c-6 10 2 24 16 22 6-1 10-4 12-8l-8-10c-4-6-14-10-20-4z" fill="#eebd9a" stroke="#1a1a1f" strokeWidth="3.5"/>
    <path id="logo.tragus" d="M124 150c-9-2-11 11-4 18 6 4 14 2 14-5" stroke="#1a1a1f" strokeWidth="4.5"/>
  </g>
  <g id="logo.sweat" fill="#14d6cc"><path d="M216 44c6 8 8 12 4 16-5 3-12-4-4-16z"/><path d="M100 50c5 7 7 10 3 14-5 3-11-3-3-14z"/></g>
  <g id="logo.sparks" stroke="#14d6cc" strokeWidth="5" strokeLinecap="round"><path d="M8 38l10 8M28 22l6 12M52 14l2 12"/></g>
    </svg>
  );
}
