export type Mood = "neutral" | "happy" | "sad";
export type MascotCharacter = "mccartney" | "gardel" | "homer" | "jaws";

export function getMascotCharacter(intervalId: string | null | undefined): MascotCharacter | null {
  if (!intervalId) return null;
  if (intervalId === "m2-asc") return "jaws";
  if (intervalId === "m3-desc") return "mccartney";
  if (intervalId === "TT-asc") return "homer";
  if (intervalId === "M6-asc") return "gardel";
  return null;
}

interface PhotoConfig {
  src: string;
  alt: string;
  objectPosition: string;
}

const CHARACTERS: Record<MascotCharacter, { happy: PhotoConfig; sad: PhotoConfig; neutral: PhotoConfig }> = {
  jaws: {
    happy: {
      src: "/images/jaws/happy.jpg",
      alt: "Steven Spielberg riendo en la boca del tiburón (Jaws)",
      objectPosition: "object-[60%_50%] scale-110",
    },
    sad: {
      src: "/images/jaws/sad.jpg",
      alt: "Jefe Brody tenso con el cigarrillo y el tiburón acechando",
      objectPosition: "object-[60%_40%] scale-105",
    },
    neutral: {
      src: "/images/jaws/sad.jpg",
      alt: "Tiburón acechando (Jaws)",
      objectPosition: "object-[60%_40%] scale-105",
    },
  },
  mccartney: {
    happy: {
      src: "/images/mccartney/happy.jpg",
      alt: "Paul McCartney sonriendo (Hey Jude)",
      objectPosition: "object-[50%_25%] scale-105",
    },
    sad: {
      src: "/images/mccartney/sad.jpg",
      alt: "Paul McCartney triste (Hey Jude)",
      objectPosition: "object-center",
    },
    neutral: {
      src: "/images/mccartney/sad.jpg",
      alt: "Paul McCartney serio (Hey Jude)",
      objectPosition: "object-center",
    },
  },
  gardel: {
    happy: {
      src: "/images/gardel/happy.jpg",
      alt: "Carlos Gardel sonriendo con el sombrero",
      objectPosition: "object-[50%_32%] scale-110",
    },
    sad: {
      src: "/images/gardel/sad.webp",
      alt: "Carlos Gardel melancólico con la copa",
      objectPosition: "object-[55%_35%] scale-105",
    },
    neutral: {
      src: "/images/gardel/happy.jpg",
      alt: "Carlos Gardel",
      objectPosition: "object-[50%_32%] scale-110",
    },
  },
  homer: {
    happy: {
      src: "/images/homer/happy.jpg",
      alt: "Homero Simpson festejando (The Simpsons)",
      objectPosition: "object-[50%_25%] scale-105",
    },
    sad: {
      src: "/images/homer/sad.jpg",
      alt: "Homero Simpson enojado/frustrado",
      objectPosition: "object-center",
    },
    neutral: {
      src: "/images/homer/happy.jpg",
      alt: "Homero Simpson",
      objectPosition: "object-[50%_25%] scale-105",
    },
  },
};

function CharacterPhoto({ character, mood }: { character: MascotCharacter; mood: Mood }) {
  const cfg = CHARACTERS[character][mood];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-full bg-zinc-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cfg.src}
        alt={cfg.alt}
        className={`h-full w-full rounded-full object-cover select-none transition-transform duration-300 ${cfg.objectPosition} ${
          mood === "sad" ? "brightness-90 contrast-105" : ""
        }`}
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

export interface MascotProps {
  intervalId?: string | null;
  revealed?: boolean;
  mood: Mood;
  /** Retrocompatibilidad */
  heyJude?: boolean;
}

export function Mascot({ intervalId, revealed = true, mood, heyJude }: MascotProps) {
  const resolvedId = heyJude ? "m3-desc" : intervalId;
  const character = revealed ? getMascotCharacter(resolvedId) : null;

  return character ? <CharacterPhoto character={character} mood={mood} /> : <NoteBadge mood={mood} />;
}
