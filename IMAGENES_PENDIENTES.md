# BurpEars — imágenes de personajes pendientes

La app muestra una imagen por **intervalo y dirección** en el cartel de resultado, con una versión **feliz** (acertó) y otra **triste** (falló).

- **Ubicación:** `public/images/<nombre>/happy.jpg` y `public/images/<nombre>/sad.jpg`.
- **Registro en el código:** `src/components/mascot.tsx` (`getMascotCharacter` y `CHARACTERS`).
- **Formato:** cuadrado o casi cuadrado, con la cara centrada: se recorta en círculo.

## Ya tienen imagen (12 de 24)

| Intervalo | Personaje |
|---|---|
| 2da menor asc | Tiburón (Jaws) |
| 2da menor desc | Beethoven (Para Elisa) |
| 2da mayor desc | Paul McCartney (Yesterday) |
| 3ra menor asc | Deep Purple (Smoke on the Water) |
| 3ra menor desc | Paul McCartney (Hey Jude) |
| 4ta justa desc | Mozart (Pequeña serenata nocturna) |
| Tritono asc | Homero (Los Simpsons) |
| 5ta justa asc | Luke Skywalker (Star Wars) |
| 5ta justa desc | Pedro Picapiedra |
| 6ta mayor asc | Carlos Gardel |
| 6ta mayor desc | Radiohead (No Surprises) |
| 7ma menor asc | ABBA (*The Winner Takes It All*) |

## Faltan (12)

| Intervalo | Canciones | Personaje sugerido |
|---|---|---|
| 2da mayor asc | Cumpleaños feliz · Martinillo | Torta con velitas (ilustración) |
| 3ra mayor asc | When the Saints Go Marching In · Kumbaya | Trompeta (Louis Armstrong) |
| 3ra mayor desc | 5ta Sinfonía (Beethoven) · Swing Low, Sweet Chariot | Beethoven |
| 4ta justa asc | Marcha nupcial (Wagner) · A Hard Day's Night · Himno Nacional Argentino | Novia, o San Martín |
| Tritono desc | Black Sabbath · Even Flow (Pearl Jam) | Ozzy Osbourne |
| 6ta menor asc | The Entertainer (Joplin) · Conquest of Paradise (Vangelis) | Scott Joplin o Vangelis |
| 6ta menor desc | Love Story (Francis Lai) · Chega de Saudade (Tom Jobim) | Tom Jobim |
| 7ma menor desc | Watermelon Man (Herbie Hancock) · Blanca Navidad | Papá Noel (ilustración) |
| 7ma mayor asc | Take On Me (a-ha) · Superman (John Williams) | a-ha (estilo cómic) |
| 7ma mayor desc | I Love You (Cole Porter) · Have Yourself a Merry Little Christmas | Cole Porter |
| 8va justa asc | Somewhere Over the Rainbow (Judy Garland) · Singin' in the Rain (Gene Kelly) | Judy Garland o Gene Kelly |
| 8va justa desc | Doogie Howser, M.D. (Mike Post) · Willow Weep for Me | Doogie Howser |

Beethoven aparece en dos intervalos (2da menor desc y 3ra mayor desc). Se puede reutilizar la misma imagen o dejar uno de ellos para otro personaje (Mozart, Sinatra).

## Quién consigue cada imagen

- **Ilustraciones propias** (las puede hacer el asistente en el estilo del logo, con versión feliz y triste, sin problemas de derechos): corderito, torta, Papá Noel, novia, trompeta, león y Beethoven.
  - El retrato de Beethoven de Stieler (1820) es de dominio público, por si se prefiere partir de ahí.
- **Fotos de personas actuales:** hay que conseguirlas manualmente (el asistente no puede buscarlas ni descargarlas de forma confiable, y tienen derechos de autor). Alternativa: caricaturas ilustradas.
