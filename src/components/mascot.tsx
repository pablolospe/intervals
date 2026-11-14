export type Mood = "neutral" | "happy" | "sad";
export type MascotCharacter = "mccartney" | "gardel" | "homer" | "jaws" | "luke" | "flintstones" | "beethoven" | "deep-purple" | "mozart" | "radiohead" | "abba" | "aha" | "judy";

export function getMascotCharacter(intervalId: string | null | undefined): MascotCharacter | null {
  if (!intervalId) return null;
  if (intervalId === "m2-asc") return "jaws";
  if (intervalId === "m2-desc" || intervalId === "M3-desc") return "beethoven";
  if (intervalId === "m3-asc") return "deep-purple";
  if (intervalId === "m3-desc" || intervalId === "M2-desc") return "mccartney";
  if (intervalId === "P4-desc") return "mozart";
  if (intervalId === "TT-asc") return "homer";
  if (intervalId === "P5-asc") return "luke";
  if (intervalId === "P5-desc") return "flintstones";
  if (intervalId === "M6-asc") return "gardel";
  if (intervalId === "M6-desc") return "radiohead";
  if (intervalId === "m7-asc") return "abba";
  if (intervalId === "M7-asc") return "aha";
  if (intervalId === "P8-asc") return "judy";
  return null;
}

interface PhotoConfig {
  src: string;
  alt: string;
  objectPosition: string;
}

const CHARACTERS: Record<MascotCharacter, { label: string; happy: PhotoConfig; sad: PhotoConfig; neutral: PhotoConfig }> = {
  jaws: {
    label: "Tiburón (Jaws) · John Williams",
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
    label: "Paul McCartney · The Beatles",
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
    label: "Carlos Gardel",
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
    label: "Homero Simpson · Los Simpson",
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
  luke: {
    label: "Luke Skywalker · Star Wars",
    happy: {
      src: "/images/luke/happy.jpg",
      alt: "Luke Skywalker sonriendo (Star Wars)",
      objectPosition: "object-[50%_30%] scale-105",
    },
    sad: {
      src: "/images/luke/sad.jpg",
      alt: "Luke Skywalker sufriendo en Ciudad Nube (Star Wars)",
      objectPosition: "object-[50%_40%] scale-110",
    },
    neutral: {
      src: "/images/luke/happy.jpg",
      alt: "Luke Skywalker (Star Wars)",
      objectPosition: "object-[50%_30%] scale-105",
    },
  },
  flintstones: {
    label: "Pedro Picapiedra · Los Picapiedras",
    happy: {
      src: "/images/flintstones/happy.jpg",
      alt: "Pedro Picapiedra sonriendo (Los Picapiedras)",
      objectPosition: "object-[55%_45%] scale-100",
    },
    sad: {
      src: "/images/flintstones/sad.jpg",
      alt: "Pedro Picapiedra desanimado/cansado (Los Picapiedras)",
      objectPosition: "object-center scale-100",
    },
    neutral: {
      src: "/images/flintstones/happy.jpg",
      alt: "Pedro Picapiedra (Los Picapiedras)",
      objectPosition: "object-[55%_45%] scale-100",
    },
  },
  beethoven: {
    label: "Ludwig van Beethoven",
    happy: {
      src: "/images/beethoven/happy.jpg",
      alt: "Ludwig van Beethoven sonriendo (Para Elisa)",
      objectPosition: "object-[52%_22%] scale-125",
    },
    sad: {
      src: "/images/beethoven/sad.jpg",
      alt: "Ludwig van Beethoven serio con el ceño fruncido (Para Elisa)",
      objectPosition: "object-center scale-105",
    },
    neutral: {
      src: "/images/beethoven/sad.jpg",
      alt: "Ludwig van Beethoven (Para Elisa)",
      objectPosition: "object-center scale-105",
    },
  },
  "deep-purple": {
    label: "Ritchie Blackmore · Deep Purple",
    happy: {
      src: "/images/deep-purple/happy.jpg",
      alt: "Ritchie Blackmore tocando con entusiasmo (Deep Purple — Smoke on the Water)",
      objectPosition: "object-[46%_28%] scale-110",
    },
    sad: {
      src: "/images/deep-purple/sad.jpg",
      alt: "Ritchie Blackmore serio (Deep Purple — Smoke on the Water)",
      objectPosition: "object-center scale-105",
    },
    neutral: {
      src: "/images/deep-purple/happy.jpg",
      alt: "Ritchie Blackmore (Deep Purple — Smoke on the Water)",
      objectPosition: "object-[46%_28%] scale-110",
    },
  },
  mozart: {
    label: "Wolfgang Amadeus Mozart",
    happy: {
      src: "/images/mozart/happy.jpg",
      alt: "Wolfgang Amadeus Mozart sonriendo (Pequeña serenata nocturna)",
      objectPosition: "object-[50%_35%] scale-110",
    },
    sad: {
      src: "/images/mozart/sad.jpg",
      alt: "Wolfgang Amadeus Mozart llorando (Pequeña serenata nocturna)",
      objectPosition: "object-center scale-105",
    },
    neutral: {
      src: "/images/mozart/happy.jpg",
      alt: "Wolfgang Amadeus Mozart (Pequeña serenata nocturna)",
      objectPosition: "object-[50%_35%] scale-110",
    },
  },
  radiohead: {
    label: "Thom Yorke · Radiohead",
    happy: {
      src: "/images/radiohead/happy.jpg",
      alt: "Thom Yorke sonriendo (Radiohead — No Surprises)",
      objectPosition: "object-[50%_25%] scale-110",
    },
    sad: {
      src: "/images/radiohead/sad.jpg",
      alt: "Thom Yorke furioso (Radiohead — No Surprises)",
      objectPosition: "object-center scale-105",
    },
    neutral: {
      src: "/images/radiohead/happy.jpg",
      alt: "Thom Yorke (Radiohead — No Surprises)",
      objectPosition: "object-[50%_25%] scale-110",
    },
  },
  abba: {
    label: "Agnetha de ABBA",
    happy: {
      src: "/images/abba/happy.jpg?v=2",
      alt: "ABBA sonriendo",
      objectPosition: "object-[50%_22%] scale-105",
    },
    sad: {
      src: "/images/abba/sad.jpg",
      alt: "ABBA triste",
      objectPosition: "object-center scale-105",
    },
    neutral: {
      src: "/images/abba/happy.jpg?v=2",
      alt: "ABBA",
      objectPosition: "object-[50%_22%] scale-105",
    },
  },
  aha: {
    label: "Morten Harket · a-ha",
    happy: {
      src: "/images/aha/happy.jpg",
      alt: "Morten Harket sonriendo en estilo boceto (a-ha — Take On Me)",
      objectPosition: "object-[50%_38%] scale-105",
    },
    sad: {
      src: "/images/aha/sad.jpg",
      alt: "Morten Harket serio en estilo boceto (a-ha — Take On Me)",
      objectPosition: "object-center scale-105",
    },
    neutral: {
      src: "/images/aha/happy.jpg",
      alt: "Morten Harket (a-ha — Take On Me)",
      objectPosition: "object-[50%_38%] scale-105",
    },
  },
  judy: {
    label: "Judy Garland",
    happy: {
      src: "/images/judy/happy.jpg",
      alt: "Judy Garland sonriendo con Toto (El mago de Oz — Over the Rainbow)",
      objectPosition: "object-[46%_28%] scale-105",
    },
    sad: {
      src: "/images/judy/sad.jpg",
      alt: "Judy Garland triste (El mago de Oz — Over the Rainbow)",
      objectPosition: "object-center scale-105",
    },
    neutral: {
      src: "/images/judy/happy.jpg",
      alt: "Judy Garland (El mago de Oz — Over the Rainbow)",
      objectPosition: "object-[46%_28%] scale-105",
    },
  },
};

export function getMascotLabel(intervalId: string | null | undefined): string | null {
  const ch = getMascotCharacter(intervalId);
  return ch ? CHARACTERS[ch].label : null;
}

export function getMascotReaction(
  intervalId: string | null | undefined,
  mood: "happy" | "sad",
  fallback?: string,
): string | null {
  const name = getMascotLabel(intervalId) ?? fallback;
  if (!name) return null;
  return mood === "happy" ? `Pusiste feliz a ${name}` : `${name} está triste`;
}

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
