# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the Vite React entry points: `src/main.jsx` mounts the app, `src/App.jsx` holds the primary UI and scoring logic, and `src/index.css` defines Tailwind layers and theme tokens.
- Root-level standalone components live in `car-value-scorer.jsx` (primary) and `car-value-scorer-alt-version.jsx` (alternate table layout). These are full UI components intended for reuse in other React contexts.
- Build tooling is configured via `vite.config.js`, `tailwind.config.js`, and `postcss.config.js`.
- `screenshot.mjs` uses Playwright to capture UI screenshots.

## Build, Test, and Development Commands

- `npm run dev` starts the Vite dev server for local development.
- `npm run build` creates a production build in `dist/`.
- `npm run preview` serves the production build locally.
- `node screenshot.mjs <url> <output>` captures a full-page screenshot (defaults to `screenshot.png`).

## Coding Style & Naming Conventions

- JavaScript/JSX with React hooks and functional components; keep imports grouped at the top of files.
- Use 2-space indentation and trailing commas where the surrounding file does.
- Component names use `PascalCase` (e.g., `ScoreCard`), helper functions and variables use `camelCase`.
- Styling is a mix of Tailwind utility classes and CSS variables defined in `src/index.css`.
- No formatter or linter is configured; keep style consistent with the file you edit.

## Testing Guidelines

- No automated test framework is currently configured.
- When adding tests, document the framework and update this section with the run command.

## Commit & Pull Request Guidelines

- Git history is minimal; no formal commit convention is established yet. Prefer short, imperative summaries (e.g., “Add range filter panel”).
- Pull requests should include a concise summary, key behavior changes, and screenshots for UI updates.

## Configuration & Data Notes

- UI state persists via `localStorage` keys defined in the scorer components.
- Fonts and theme tokens are centralized in `src/index.css`; update those first when changing typography or color variables.
