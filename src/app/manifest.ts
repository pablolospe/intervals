import type { MetadataRoute } from "next";

// Keep in sync with the app background (`bg-[#0b0c10]` in layout.tsx and `viewport.themeColor`).
const BACKGROUND = "#0b0c10";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BurpEars — entrená tus orejas",
    short_name: "BurpEars",
    description: "Entrená el oído: reconocé y cantá intervalos, y dictá células rítmicas.",
    lang: "es-AR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BACKGROUND,
    theme_color: BACKGROUND,
    categories: ["education", "music"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
