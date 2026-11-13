# BurpEars — reglas del proyecto

Reglas de producto, diseño, audio y trabajo acordadas hasta ahora. Si algo cambia, se actualiza acá.

## 1. Producto

- **Nombre:** BurpEars (juego de palabras: *burpees* + *ears*, "ejercicio para las orejas"). Logo: oreja musculosa con vincha, flexionando el brazo.
- **Idioma de la interfaz:** español rioplatense, con voseo ("Escuchá", "Elegí", "Adiviná").
- **Módulos del home**, en este orden:
  1. **Adivinar intervalos** → `/intervalos/adivinar` (turquesa)
  2. **Cantar intervalos** → `/intervalos/cantar` (coral)
  3. **Células rítmicas** → `/ritmo` (amarillo). El módulo se llama "Células rítmicas", no "Ritmo".
  4. **Partitura** → **deshabilitada** ("próximamente"). `/partitura` redirige al home. El código del editor se conserva.
- `/intervalos` redirige a `/intervalos/cantar`.

### Adivinar intervalos (modo sorpresa)

- La app elige el intervalo **y su dirección** (ascendente/descendente) al azar; adivinar ambos es parte del juego.
- El usuario escucha, canta raíz y objetivo, y después **nombra** el intervalo. El puntaje depende de nombrarlo, no de la afinación.
- **Regla antiespoiler:** los ejemplos musicales (canciones de referencia, su título y el botón "Escuchar referencia") **no aparecen ni suenan hasta que el usuario da su respuesta**. Si no, se podría resolver mirando el ejemplo en vez de usar el oído.
  - La UI oculta la lista de canciones mientras no esté respondido.
  - `playReference` además lo bloquea en el hook, por si algún botón se escapa.
  - Tampoco se revela el nombre del intervalo ni el personaje antes de responder.

### Cantar intervalos (modo elegir)

- El usuario elige el intervalo y la dirección; ahí los ejemplos y las canciones de referencia están disponibles como ayuda.
- Las canciones de referencia se muestran como botones con el título; **tocar el título reproduce la canción** (volver a tocarlo la repite). No hay un botón aparte de "Tocar la canción": era de cuando había un solo ejemplo.
- El puntaje depende de la afinación del intervalo cantado.

### Células rítmicas

- Se escucha un compás de 4 tiempos y se arma eligiendo la célula de cada tiempo. Tiene cuenta previa y metrónomo opcional.

## 2. Audio

- **Los ejemplos no se superponen:** cuando empieza un sonido nuevo, el anterior se corta (con un fundido de ~30 ms para evitar clics).
  - Intervalos: `SynthEngine.stopAll()`, llamado desde `playNotes`.
  - Ritmo: `RhythmPlayer.stop()`, llamado al inicio de `play()`; corta notas y clics.
- Mientras la app suena, el micrófono se ignora (`mutedRef`) para no detectarse a sí misma.
- Todo el timing va en el reloj del hardware (`AudioContext`), no en `setTimeout`.

## 3. Diseño

- **Fondo:** casi negro liso (`#0b0c10`), sin degradés de fondo. Modo oscuro único.
- **Tipografía:** Plus Jakarta Sans (variable `--font-geist-sans` por compatibilidad), pesos fuertes en títulos.
- **Paleta por módulo** (acento y sombra del botón):
  | Módulo | Acento | Borde del botón |
  |---|---|---|
  | Adivinar | `#14d6cc` | `#0b6f6b` |
  | Cantar | `#f4726f` | `#a93a38` |
  | Células rítmicas | `#ffcf3f` | `#a8820f` |
- **Cómo se aplica el tema:** cada entrenador pone `data-theme` (`recognize` / `sing` / `rhythm`) en su `<main>`. En `globals.css` ese scope **remapea la escala `emerald-*`** de Tailwind y `--accent-edge`. Por eso el código usa `emerald-*` para "el color del módulo"; no hardcodear colores de acento.
- **Botones y bordes:** botones de píldora (`rounded-full`), tarjetas muy redondeadas (`rounded-3xl`). Los botones principales son tipo tecla (borde inferior sólido que se aplasta al presionar).
- **Home:** carrusel de tarjetas (scroll horizontal con snap en celular, 3 columnas en escritorio). Cada tarjeta: ilustración, título, descripción y botón "Comenzar →" del color del módulo.
- **Menú:** barra lateral en escritorio y hamburguesa en celular. Solo Inicio y los módulos; **Resultados y Ajustes no existen** y no se muestran.
- **El menú también está dentro de cada actividad** (`SuiteShell` envuelve los entrenadores): barra lateral fija en escritorio y tablet (con el módulo activo resaltado en su color) y hamburguesa en la barra superior en celular. Ya no hay botón "← BurpEars" en los entrenadores; el logo del menú lleva al inicio.
- **Accesibilidad:** foco visible, `aria-*` en grupos de opciones, ilustraciones decorativas con `aria-hidden`, respetar `prefers-reduced-motion`.

## 4. Ilustraciones y marca

- Estilo: mancha de color con degradé + figura con trazo oscuro fino (3,5 px sobre `viewBox` 240 px), destellos y un hilito curvo abajo a la izquierda.
- Piel `#fde8d4 → #f3c4a0`, contorno `#1a1a1f`, notas crema `#fff6ec`.
- Las ilustraciones están en `src/components/illustrations.tsx`; el logo en `src/components/logo-mark.tsx`; el favicon en `src/app/icon.svg` (el logo sin las chispas, sobre un cuadrado oscuro redondeado).
- **Proceso para dibujar o editar SVG:** usar la skill `vector-illustration`, con IDs semánticos (`ear.helix`, `mouth.tongue`), validar con `validate_svg.py` y **mirar el render** sobre el fondo oscuro de la app (no solo sobre blanco). Comparar contra la imagen de diseño de referencia.
- En esta máquina no hay `rsvg-convert` ni CairoSVG; se renderiza con `qlmanage -t -s <px> -o <dir> archivo.svg`. No instalar herramientas sin avisar.

## 5. Código

- **Next.js 16 con cambios incompatibles:** leer la guía correspondiente en `node_modules/next/dist/docs/` antes de escribir código de Next (ver `AGENTS.md`).
- Los componentes y datos compartidos entre servidor y cliente no se exportan desde un archivo `"use client"` si el servidor los usa (por eso `MODULES` está en `src/lib/modules.ts`).
- Evitar diferencias servidor/cliente que rompan la hidratación (nada de `Date.now()`, `Math.random()` ni idioma del usuario en el render inicial). Si aparece un error de hidratación tras renombrar rutas, probar primero `rm -rf .next` y reiniciar `pnpm dev`.
- El estado del entrenador vive en Zustand (`src/store/trainer-store.ts`); el audio, en clases sin React (`src/lib/audio`, `src/lib/rhythm`).
- Para documentación de librerías, consultar Context7 antes que memoria.

## 6. Verificación antes de dar algo por hecho

- `npx tsc --noEmit`, `npx eslint src`, `npx vitest run` y `pnpm build` deben pasar. Hoy hay un error de `eslint` previo (`setSelectedSongIndex` dentro de un efecto en `trainer-app.tsx`) y una advertencia (`OK_ONLY` sin usar) que no son de cambios recientes.
- Los cambios visuales y de audio se prueban en `pnpm dev`; type-check y tests no cubren cómo se ve ni cómo suena.

## 7. Trabajo con el asistente

- Preguntar cuando hay una decisión de diseño con varias lecturas razonables; si no, avanzar con el criterio más conservador y avisarlo.
- Los commits terminan con la línea de atribución indicada por la configuración de Claude Code.
- Antes de borrar o sobrescribir algo, mirar qué hay.
