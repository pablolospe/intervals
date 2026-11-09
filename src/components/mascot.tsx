export type Mood = "neutral" | "happy" | "sad";

/** Fotos de Paul McCartney utilizadas como reacción para "Hey Jude" (3ra menor descendente). */
function PaulPhoto({ mood }: { mood: Mood }) {
  const isHappy = mood === "happy";
  const src = isHappy ? "/images/mccartney/happy.jpg" : "/images/mccartney/sad.jpg";
  const alt = isHappy ? "Paul McCartney sonriendo" : "Paul McCartney serio";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-full bg-zinc-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`h-full w-full rounded-full object-cover select-none transition-transform duration-300 ${
          isHappy ? "object-[50%_25%] scale-105" : "object-center"
        } ${mood === "sad" ? "brightness-90 contrast-105" : ""}`}
      />
      {mood === "sad" && (
        <svg
          viewBox="0 0 24 24"
          className="absolute bottom-1 right-1 h-3.5 w-3.5 sm:h-5 sm:w-5 drop-shadow"
          aria-hidden="true"
        >
          <path
            d="M12 2.5 C12 2.5 6 10 6 15 A6 6 0 0 0 18 15 C18 10 12 2.5 12 2.5 Z"
            fill="#38bdf8"
          />
        </svg>
      )}
    </div>
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
  return heyJude ? <PaulPhoto mood={mood} /> : <NoteBadge mood={mood} />;
}
