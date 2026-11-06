# 🎯 Plan de Acción: **Intervals** (Mnemonic Ear Trainer & Web Audio Lab)

## 1. Propósito Estratégico (Por qué este proyecto mueve la aguja)

Este proyecto no es una app más de portfolio: es la demostración técnica en código de tu mayor ventaja competitiva (**Desarrollador Full Stack + Compositor Musical + Docente**). 

Está diseñado específicamente para cubrir las dos brechas clave que miran los Tech Leads en empresas de producto internacional (como **Flat.io, Simply, BandLab, Soundtrap, Moises.ai**):
1. **Dominio real de la Web Audio API nativa:** Sin depender de librerías que escondan la complejidad, demostrando manejo del grafo de audio, síntesis en tiempo real, manipulación de buffers en memoria, pitch-shifting y procesamiento digital de señales (DSP) desde el micrófono.
2. **Madurez de Ingeniería (Testing Automatizado & CI/CD):** Cobertura de tests unitarios sobre la matemática musical y el detector de frecuencias con **Vitest**, tests E2E con **Playwright** y un pipeline de integración continua en **GitHub Actions**.

---

## 2. Concepto del Producto

Un entrenador interactivo de audioperceptiva basado en el método real de asociación mnémica (**recordar intervalos a través de los primeros compases de canciones icónicas**).

### Flujo de Usuario (Core Loop)
1. **Escuchar el Desafío:** La app elige un intervalo (ej. *3ra Menor Descendente*) y una nota de partida aleatoria dentro de un rango cómodo. Reproduce las dos notas del intervalo con su **Motor Instrumental (Síntesis Web Audio)**.
2. **Referencia Mnémica (Doble Motor):** Si el usuario necesita ayuda o está en modo estudio, puede disparar la referencia de la canción (*"Hey Jude"*):
   * **Modo Clip Real (Pitcheado):** Reproduce el micro-fragmento de audio real (2 a 4 segundos) transportado dinámicamente (`detune` / `playbackRate`) para que coincida exactamente con la tonalidad del ejercicio actual (dentro de un rango cuidado de $\pm 3$ semitonos para mantener naturalidad tímbrica).
   * **Modo Melodía Instrumental:** Reproduce el motivo melódico y rítmico completo de la canción sintetizado en vivo en cualquier tonalidad.
3. **Cantar el Intervalo (Evaluación en Vivo):**
   * El usuario canta la **Nota 1 (Raíz)** y luego la **Nota 2 (Objetivo)** en su micrófono.
   * La app normaliza la octava según el registro vocal del usuario o mide la relación matemática exacta entre ambas notas cantadas:
     $$\text{semitonos} = 12 \cdot \log_2\left(\frac{f_2}{f_1}\right)$$
   * Un visualizador en `<canvas>` a 60fps muestra la onda de la voz, la nota detectada, el desvío en *cents* ($\pm 50$) y una barra de estabilización (mantener la afinación durante ~400ms para validar la nota).

---

## 3. Stack Tecnológico y Arquitectura

* **Framework & UI:** Next.js (App Router), React 19, TypeScript estricto, Tailwind CSS.
* **Estado de Aplicación:** Zustand (para la máquina de estados del entrenamiento, puntaje, configuración y catálogo, estrictamente desacoplado del hilo de procesamiento de audio).
* **Visualización:** HTML5 `<canvas>` con `requestAnimationFrame` a 60fps (osciloscopio + aguja/indicador de afinación en cents).
* **Calidad y Testing:** Vitest (Unit & DSP math testing), Playwright (E2E), GitHub Actions (CI).

### Arquitectura de Módulos de Audio (`src/lib/audio/`)
Todo el motor de audio se escribe en **TypeScript puro y desacoplado de React**, garantizando cero glitches por re-renders:

1. **`MusicMath` (`music-math.ts`):**
   * Conversión de frecuencia (Hz) a nota MIDI y viceversa ($f = 440 \cdot 2^{(m - 69)/12}$).
   * Cálculo de desvío en *cents* respecto al temperamento igual.
   * Cálculo de distancia interválica relativa e invariante a la octava (*pitch class*).
2. **`SynthEngine` (`synth-engine.ts`):**
   * Síntesis sustractiva cálida (tipo piano eléctrico Rhodes/Wurlitzer) combinando `OscillatorNode` (triangle + sine), `BiquadFilterNode` (lowpass) y `GainNode` con envolvente **ADSR** programada sobre el reloj de hardware (`audioContext.currentTime`).
   * Secuenciador para tocar tanto el par de notas del intervalo como el motivo rítmico-melódico de cada canción en cualquier tonalidad.
3. **`SampleEngine` (`sample-engine.ts`):**
   * Carga asíncrona y caché de micro-clips (`fetch` $\rightarrow$ `decodeAudioData` $\rightarrow$ `Map<string, AudioBuffer>`).
   * Reproducción mediante `AudioBufferSourceNode` con cálculo automático de `detune` (en cents: $\Delta \text{semitonos} \times 100$) para alinear la nota original del clip con la nota raíz del ejercicio, aplicando *fade-in* y *fade-out* suaves con `GainNode` para evitar clicks.
4. **`PitchDetector` (`pitch-detector.ts`):**
   * Captura de stream con `navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false } })` (configuración cruda ideal para música).
   * Extracción de buffer en dominio temporal vía `AnalyserNode.getFloatTimeDomainData`.
   * Algoritmo de **Autocorrelación / McLeod Pitch Method (MPM)** para obtener la frecuencia fundamental ($f_0$) ignorando armónicos superiores, con umbral de volumen (RMS Gate) para ignorar el ruido ambiente.

---

## 4. Catálogo Completo de Intervalos y Canciones Mnémicas

Cada intervalo cuenta con su definición matemática, equivalencia en tonos/semitonos y ejemplos representativos tanto **ascendentes** como **descendentes**:

| Intervalo | Semitonos / Tonos | Ejemplos Ascendentes | Ejemplos Descendentes |
| :--- | :---: | :--- | :--- |
| **2da Menor (2m)** | 1 semitono (½ T) | *Tiburón* (tema principal), *La Pantera Rosa* | *Para Elisa* (Beethoven) |
| **2da Mayor (2M)** | 2 semitonos (1 T) | *Cumpleaños feliz* ("Cum-ple-años..."), *Martinillo* | *Yesterday* (The Beatles) |
| **3ra Menor (3m)** | 3 semitonos (1½ T) | *Arrullo* (Brahms), *Greensleeves* | *Hey Jude* (The Beatles), *Canción de despedida* (Barney) |
| **3ra Mayor (3M)** | 4 semitonos (2 T) | *Oh! When the Saints* | *5ta Sinfonía* (Beethoven - transiciones), *La Primavera* (Vivaldi) |
| **4ta Justa (4J)** | 5 semitonos (2½ T) | *Marcha nupcial* (Wagner), *A Hard Day's Night* (The Beatles) | *Pequeña serenata nocturna* (Mozart) |
| **4ta Aumentada / Tritono (4A / 5d)** | 6 semitonos (3 T) | *Tema de Los Simpson* | *Even Flow* (Pearl Jam - inicio del verso) |
| **5ta Justa (5J)** | 7 semitonos (3½ T) | *Tema principal de Star Wars*, *Estrellita (Twinkle Twinkle)* | *Tema de Los Picapiedra (The Flintstones)* |
| **6ta Menor (6m)** | 8 semitonos (4 T) | *The Entertainer* (Scott Joplin), *El día que me quieras* (Gardel) | *Tema de Love Story* |
| **6ta Mayor (6M)** | 9 semitonos (4½ T) | *My Way* (Frank Sinatra) | *No Surprises* (Radiohead) |
| **7ma Menor (7m)** | 10 semitonos (5 T) | *The Winner Takes It All* (ABBA) | *Blanca Navidad (White Christmas)* |
| **7ma Mayor (7M)** | 11 semitonos (5½ T) | *Take on Me* (A-ha), *Superman* (tema principal) | *I Love You* (Cole Porter) |
| **8va Justa (8J)** | 12 semitonos (6 T) | *Somewhere Over the Rainbow* | *Tema de Doogie Howser* |

---

## 5. Hoja de Ruta (Fases de Implementación)

### Fase 1: Esqueleto, Matemática Musical y Suite de Tests (TDD)
* [ ] Inicializar proyecto Next.js + TypeScript + Tailwind + Vitest en `/Users/pablolospe/Documents/proyectos/proyectos-personales/intervals`.
* [ ] Implementar `music-math.ts` y el detector de pitch por autocorrelación sobre buffers de números (`Float32Array`).
* [ ] Escribir los tests unitarios en **Vitest** generando ondas senoidales matemáticas (440Hz, 261.63Hz, etc.) para comprobar que el algoritmo detecta las notas y calcula intervalos con precisión menor a 1 cent.

### Fase 2: Motor Híbrido de Reproducción (`SynthEngine` + `SampleEngine`)
* [ ] Construir `SynthEngine` con envolvente ADSR y reproducción de secuencias melódicas transportables.
* [ ] Construir `SampleEngine` con carga de `AudioBuffer` y pitcheo dinámico (`detune`) sincronizado con la nota base del ejercicio.
* [x] Definir el catálogo tipado de intervalos y canciones (`intervals-catalog.ts` con ejemplos ascendentes y descendentes).

### Fase 3: Captura de Micrófono y Estabilizador Vocal
* [ ] Conectar `PitchDetector` al micrófono real del navegador.
* [ ] Implementar el filtro de estabilidad temporal (confirmar nota cuando el cantante se mantiene dentro de $\pm 35$ cents durante 400ms continuos) y la normalización automática de octava para adaptarse a cualquier registro vocal (masculino o femenino).

### Fase 4: Interfaz Interactiva, Máquina de Estados y Visualizador Canvas
* [ ] Crear el store en Zustand para gestionar los estados: `IDLE` $\rightarrow$ `PLAYING_INTERVAL` $\rightarrow$ `SINGING_ROOT` $\rightarrow$ `SINGING_TARGET` $\rightarrow$ `SUCCESS`.
* [ ] Desarrollar el componente `<PitchCanvas />` a 60fps con onda en vivo y medidor de afinación.
* [ ] Construir el panel de control con selector de intervalos, toggle **Clip Original Pitcheado / Versión Instrumental**, e indicadores de progreso.

### Fase 5: Cierre de Ingeniería (CI/CD & Documentación de Alto Impacto)
* [ ] Configurar `.github/workflows/ci.yml` para correr linter, typecheck y Vitest en cada push.
* [ ] Redactar un `README.md` técnico orientado a reclutadores y líderes de ingeniería (explicando la arquitectura del grafo de Web Audio, el algoritmo de autocorrelación y el pitch-shifting).
