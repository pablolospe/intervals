# Plan de acción: progreso guardado + PWA

Dos objetivos, sin backend ni base de datos:

1. **Que el progreso no se pierda**: ni al moverse entre secciones ni al cerrar o recargar la app.
2. **Que se pueda instalar en el celu** como PWA, y que funcione offline.

Orden: **Fase 1 → Fase 2 → Fase 3**. Cada fase se puede mergear sola.

---

## Diagnóstico (estado actual)

| Módulo | Dónde vive el estado | ¿Sobrevive a navegar? | ¿Sobrevive a recargar? |
|---|---|---|---|
| Adivinar / Cantar | `useTrainer` (Zustand, `src/store/trainer-store.ts`) | Sí | No |
| Células rítmicas | `useState` en `rhythm-trainer.tsx` | **No**: se resetea al salir | No |
| Partitura | `useState` en `score-editor.tsx` | No | No (está deshabilitada, queda afuera de este plan) |

Hay además dos problemas en `useTrainer` que conviene arreglar antes de persistir:

- **Adivinar y Cantar comparten el mismo `score`.** Los aciertos de un modo se suman al otro. Al guardarlo, el error quedaría fijo.
- **Comparten la misma `selection`.** Al entrar a Adivinar se fuerza `"random"`, y al volver a Cantar se pisa con `"P5"` (`trainer-app.tsx:29-30`). El intervalo que el usuario eligió en Cantar se pierde cada vez que pasa por Adivinar.

---

## Fase 1: Persistencia con Zustand + localStorage ✅ (hecha)

### 1.1 Separar el estado por modo en `trainer-store.ts`

- [ ] Cambiar `score` por `scores: { recognize: Score; sing: Score }` y sumar puntos según el modo activo.
- [ ] Dejar `selection` solo para Cantar (`singSelection`, default `"P5"`). En Adivinar, el modo `"random"` se deriva del `mode` y no se guarda en el estado.
- [ ] Ajustar `trainer-app.tsx` para que no pise la selección al montar.
- [ ] Actualizar `trainer-store.test.ts` (ya existe) con casos de puntajes separados.

### 1.2 Store nuevo para Células rítmicas: `src/store/rhythm-store.ts`

- [ ] Mover a Zustand la **configuración** (`bpm`, `subdivision`, `includeRests`, `metronome`) y las **stats** (`score`, `total`, `streak`).
- [ ] Decidir si el ejercicio en curso (`target`, `answer`, `cursor`, `checked`) va al store para sobrevivir a la navegación. Recomendación: **sí al store y no a localStorage**, así al volver de otra sección encontrás el ejercicio donde lo dejaste, pero una recarga arranca limpia.
- [ ] `playing` y las refs del `RhythmPlayer` quedan en el componente: es estado de audio, no de la app.
- [ ] Tests en `rhythm-store.test.ts` para sumar acierto, sumar error y "Me rindo" (cuenta como error y corta la racha, ver `REGLAS.md`).

### 1.3 Middleware `persist`

En cada store:

```ts
persist(storeFn, {
  name: "burpears:trainer",          // "burpears:rhythm" en el otro
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: (s) => ({ lang: s.lang, scores: s.scores, singSelection: s.singSelection, direction: s.direction }),
  migrate: (persisted, version) => persisted as ..., // listo para cambios futuros
  skipHydration: true,
})
```

Qué se guarda y qué no:

| Se guarda | No se guarda (transitorio) |
|---|---|
| `lang` | `phase`, `currentId` |
| `scores` por modo | `rootMidi`, `rootHz`, `evaluation` |
| `singSelection`, `direction` | `answerId`, `micError` |
| Ritmo: `bpm`, `subdivision`, `includeRests`, `metronome`, stats | Ritmo: ejercicio en curso, `playing` |

Si se guardara `phase`, la app podría arrancar trabada en `SINGING_TARGET` sin intervalo cargado.

### 1.4 Hidratación sin mismatch (SSR + `cacheComponents`)

El servidor renderiza con los valores por defecto y no puede leer localStorage. Para que no haya errores de hidratación:

- [ ] Usar `skipHydration: true` en ambos stores.
- [ ] Crear `src/components/store-hydrator.tsx` (`"use client"`). En un `useEffect` llama a `useTrainer.persist.rehydrate()` y `useRhythm.persist.rehydrate()`. Montarlo una vez en `layout.tsx`.
- [ ] Exponer un flag `hydrated` (vía `persist.onFinishHydration` / `hasHydrated()`). Mientras sea `false`, mostrar los contadores atenuados para que no aparezca un `0/0` que cambia de golpe.
- [ ] Revisar las docs de `persist` de Zustand 5 con Context7 antes de implementar.

### 1.5 Pedir almacenamiento persistente

- [ ] Llamar a `navigator.storage?.persist?.()` una vez desde el hidratador. Así el navegador no borra los datos cuando le falta espacio.

### 1.6 Opcional, si sobra tiempo: stats por intervalo

- [ ] Guardar `byInterval: Record<directedId, { correct, total }>`. Son pocos datos y permiten mostrar en qué intervalos se falla más. Sale casi gratis con el mismo `persist`.
- [ ] Ojo: `REGLAS.md` dice que **"Resultados" no existe en el menú**. Antes de mostrar estas stats hay que decidir dónde van y actualizar las reglas.

### Criterio de "listo" (Fase 1)

- [ ] Cantar 3 intervalos, ir a Células rítmicas, volver: puntaje e intervalo elegido intactos.
- [ ] Recargar la página: puntajes, idioma y configuración de ritmo intactos. La fase arranca en `IDLE`.
- [ ] Los puntajes de Adivinar y Cantar son independientes.
- [ ] Sin warnings de hydration en la consola.
- [ ] `pnpm test`, `pnpm typecheck` y `pnpm lint` en verde.

---

## Fase 2: PWA instalable (manifest + íconos) ✅ (hecha; falta probar en celu real)

Next 16 soporta el manifest de forma nativa. Guía: `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` y `03-api-reference/03-file-conventions/01-metadata/manifest.md`.

- [ ] `src/app/manifest.ts` con:
  - `name: "BurpEars"`, `short_name: "BurpEars"`, `description` (la misma del layout)
  - `start_url: "/"`, `display: "standalone"`, `orientation: "portrait"`
  - `background_color` y `theme_color`: `#0b0c10`
  - `lang: "es-AR"`
- [ ] Íconos a partir de `logo-mark.tsx` (la oreja musculosa), en `public/icons/`:
  - `icon-192.png`, `icon-512.png`
  - `icon-maskable-512.png`, con el logo dentro de la zona segura (~80% central) para Android
  - `apple-touch-icon.png` (180×180)
- [ ] En `layout.tsx`:
  - `metadata.appleWebApp = { capable: true, title: "BurpEars", statusBarStyle: "black-translucent" }`
  - `export const viewport = { themeColor: "#0b0c10" }`
- [ ] Revisar el padding con `env(safe-area-inset-*)` en `suite-shell.tsx`, porque en standalone la app ocupa también la zona del notch.

### Criterio de "listo" (Fase 2)

- [ ] Chrome DevTools → Application → Manifest sin errores, con la app marcada como instalable.
- [ ] Android: aparece "Instalar app" y abre sin barra del navegador.
- [ ] iPhone: "Compartir → Agregar a inicio" muestra el ícono y el nombre correctos.
- [ ] **Micrófono en iPhone instalado:** probar Cantar intervalos en un dispositivo real, en standalone. Históricamente es el punto más frágil. Si falla, documentarlo en `REGLAS.md` y evaluar un aviso en la UI.

---

## Fase 3: Offline con service worker (Serwist)

La guía oficial de Next recomienda **Serwist** para el caché offline, y tiene un ejemplo para Turbopack (`next-turbo-basic`).

- [ ] Instalar Serwist siguiendo el ejemplo de Turbopack. Verificar los paquetes y la config actuales con Context7: no asumir la API de memoria.
- [ ] Precachear el app shell (las rutas `/`, `/intervalos/adivinar`, `/intervalos/cantar`, `/ritmo`) y `public/images` (~3.6 MB, aceptable).
- [ ] Estrategias:
  - Assets estáticos con hash (`/_next/static`): cache-first
  - Páginas: network-first con fallback a caché
  - **No interceptar los modelos de Whisper**: transformers.js ya los cachea en Cache Storage
- [ ] Headers para `/sw.js` en `next.config.ts` (`Cache-Control: no-cache`, `Content-Type` correcto), según la guía de Next.
- [ ] Service worker desactivado en `next dev`, para no pelear con el HMR.
- [ ] Actualizaciones: cuando hay versión nueva, mostrar un aviso tipo "Hay una versión nueva, tocá para actualizar" en vez de recargar sin preguntar a mitad de un ejercicio.
- [ ] Evaluar `experimental.useOffline` de Next (`offline-support.md`) para la navegación sin red. Ya usamos `cacheComponents` y `partialPrefetching`, que es lo que pide.

### Criterio de "listo" (Fase 3)

- [ ] `pnpm build && pnpm start`. Abrir la app, pasar a modo avión y recargar: carga y se puede entrenar en los tres módulos.
- [ ] Deployar una versión nueva: aparece el aviso de actualización y no se pierde el progreso guardado.
- [ ] Lighthouse → PWA sin errores.

---

## Riesgos y notas

- **localStorage es por dispositivo y navegador.** El progreso del celu no aparece en la compu. Es aceptable sin backend. Si algún día se quiere sincronizar, el `partialize` ya define qué datos mover.
- **Safari borra el localStorage de sitios no visitados en 7 días**, pero no lo hace con las PWA instaladas en inicio. La Fase 2 refuerza la Fase 1.
- **Cambios futuros en la forma de los datos:** subir `version` y escribir el `migrate`. Nunca cambiar la forma sin migración, o se pierde el progreso de los usuarios.
- **HTTPS es obligatorio** para el service worker y el micrófono. En Vercel ya está; en local, `localhost` cuenta como seguro.

## Al terminar

- [ ] Agregar a `REGLAS.md` una sección **"Persistencia"** (qué se guarda, keys de localStorage, regla de versionado) y una **"PWA"** (íconos, colores, cómo se actualiza).
