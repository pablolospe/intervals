export type Mood = "neutral" | "happy" | "sad";

const STROKE = { stroke: "#1c1917", strokeWidth: 1.8, strokeLinecap: "round" as const, fill: "none" };

/** Original mop-top cartoon (not a photo) used as the "Hey Jude" reaction face. */
function MopTop({ mood }: { mood: Mood }) {
  const brows =
    mood === "sad" ? [[22, 30, 29, 27], [35, 27, 42, 30]] : mood === "happy" ? [[22, 28, 29, 26.5], [35, 26.5, 42, 28]] : [[22, 28.5, 29, 28.5], [35, 28.5, 42, 28.5]];
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" role="img" aria-label={`Hey Jude: ${mood}`}>
      <ellipse cx="32" cy="34" rx="17" ry="19" fill="#f3c9a5" />
      <path d="M12 36 C9 14 27 6 37 9 C52 12 56 26 52 38 L48 38 C48 28 45 23 32 23 C19 23 16 29 16 38Z" fill="#3b2a20" />
      {brows.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} {...STROKE} />
      ))}
      <circle cx="26" cy="34" r="1.9" fill="#1c1917" />
      <circle cx="38" cy="34" r="1.9" fill="#1c1917" />
      {mood === "happy" && (
        <>
          <circle cx="21" cy="41" r="3" fill="#f9a8a8" opacity="0.6" />
          <circle cx="43" cy="41" r="3" fill="#f9a8a8" opacity="0.6" />
          <path d="M23 43 Q32 55 41 43 Z" fill="#fff" stroke="#1c1917" strokeWidth="1.6" strokeLinejoin="round" />
        </>
      )}
      {mood === "neutral" && <path d="M27 46 L37 46" {...STROKE} />}
      {mood === "sad" && (
        <>
          <path d="M25 50 Q32 42 39 50" {...STROKE} />
          <ellipse cx="25" cy="40" rx="1.6" ry="2.6" fill="#7dd3fc" />
        </>
      )}
    </svg>
  );
}

function NoteBadge({ mood }: { mood: Mood }) {
  const color = mood === "happy" ? "#6ee7b7" : mood === "sad" ? "#fcd34d" : "#a1a1aa";
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" role="img" aria-label="note">
      <path d="M26 44 V16 L46 12 V40" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="21" cy="45" rx="7" ry="5.5" fill={color} />
      <ellipse cx="41" cy="41" rx="7" ry="5.5" fill={color} />
    </svg>
  );
}

export function Mascot({ heyJude, mood }: { heyJude: boolean; mood: Mood }) {
  return heyJude ? <MopTop mood={mood} /> : <NoteBadge mood={mood} />;
}
