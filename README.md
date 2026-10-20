# Inglés: los presentes

Sitio de repaso para clases particulares de inglés (nivel A1): **rutinas, Present Simple, adverbios
de frecuencia y Present Continuous**, siguiendo las unidades 5, 6 y 8 del libro del curso.

👉 **https://maxinunez24.github.io/particular-ingles/**

Cada tema tiene una explicación corta en castellano, ejemplos con audio (voz del navegador) y
ejercicios que se corrigen solos y explican el error. Al final hay errores típicos, dos simulacros de
examen con nota y un machete imprimible.

## Cómo está hecho

Astro + Starlight, con los componentes de ejercicios reutilizados de la plataforma del curso
[Pensamiento Computacional](https://github.com/MaxiNunez24/pensamiento-computacional-testing-2026)
(`OpcionMultiple`, `Clasificar`, `OrdenarPasos` y el guardado de progreso), más cuatro propios para
inglés:

| Componente | Para qué |
|---|---|
| `Completar` | Frases con huecos (`___`) y opciones (`{am|*is|are}`). Acepta contracciones en las dos formas. |
| `ArmarFrase` | Tocar las palabras en orden (orden de las preguntas, lugar de los adverbios). |
| `Simulacro` | Examen: se entrega una vez y muestra nota, respuesta correcta y explicación. |
| `Say` / `Ejemplos` | Frases con 🔊 (Web Speech API, voz en-GB). |

## Desarrollo

```bash
pnpm install
pnpm dev      # http://localhost:4321/particular-ingles/
pnpm build
```

Cada push a `main` se publica solo en GitHub Pages (`.github/workflows/deploy.yml`).

Los PDFs del libro no están en el repo (tienen copyright): quedan en `_material/`, que está en
`.gitignore`. Los ejercicios son originales; del libro se toma solo el temario y el vocabulario.
