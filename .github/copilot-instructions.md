# Copilot instructions — Tools Page Design

Quick, actionable guidance for AI agents working on this repo.

- **Big picture:** This is a two-part project: a React + Vite TypeScript frontend and a small Go backend.
  - Frontend: built with Vite (`vite.config.ts`) + React + SWC. Sources live under `src/`.
  - Backend: a lightweight Go API in `band-info-backend/main.go` that reads JSON files from `band-info-backend/data/` and serves formatted band data.

- **How to run locally:**
  ```bash
  # frontend
  npm install
  npm run dev        # starts Vite (vite.config.ts -> server.port = 3000)

  # backend (run from the backend folder so relative data paths work)
  cd band-info-backend
  go run main.go     # starts API on :8080
  ```

- **Important integration points:**
  - Frontend tool `src/components/tools/BandInfo.tsx` uses `API_BASE_URL = 'http://localhost:8080/api'` and expects the backend endpoints:
    - `GET /api/bands/{rat}` (rat = NR or LTE)
    - `GET /api/bands/{rat}/{band}`
    - `GET /health`
  - Backend transforms raw JSON to the frontend-friendly shape in `FormatBandData` (see `band-info-backend/main.go`). Keep these shapes in sync when changing fields.

- **Project-specific conventions & patterns:**
  - Component layout: `src/components/` with tool implementations in `src/components/tools/` and UI primitives in `src/components/ui/`.
  - Tools available in the UI are declared in `src/components/ToolsList.tsx`. To add a new tool: add a component in `src/components/tools/` and add an entry to `ToolsList` (and update `ToolType` in `src/App.tsx` if needed).
  - Vite alias `'@'` maps to `./src` (see `vite.config.ts`). Prefer `@/` imports for repo-local modules.
  - Theme persistence: frontend reads/writes `localStorage.theme` and toggles `document.documentElement.classList` for dark mode (`src/App.tsx`).

- **Common pitfalls & notes for changes:**
  - The Go backend reads `data/3GPP-*.json` using relative paths. Start the backend from `band-info-backend/` or build a binary there so data files are found.
  - CORS: backend currently allows origin `http://localhost:5173` (see `band-info-backend/main.go`) while `vite.config.ts` sets `server.port = 3000`. If you change Vite's port or run on a different host, update the backend CORS `AllowedOrigins` or the frontend `API_BASE_URL`.
  - If you modify the API response shape, update both `FormatBandData` in Go and the TypeScript interfaces in `src/components/tools/BandInfo.tsx` (and any consumers).

- **Build & deploy:**
  - Frontend production build: `npm run build` -> output folder `build/`.
  - Backend: `go build` inside `band-info-backend/` to produce a binary.

- **Files to inspect first when debugging or extending:**
  - `src/components/tools/BandInfo.tsx` — API usage and expected data shape.
  - `band-info-backend/main.go` — data loading, `FormatBandData`, endpoints, and CORS.
  - `vite.config.ts` — aliases and dev server port.
  - `src/components/ToolsList.tsx` and `src/App.tsx` — how tools are wired into the UI and global types (`ToolType`, `PageType`).

- **Behavioral guidance for PRs:**
  - Minimize breaking changes to the API; coordinate changes across frontend and backend in the same PR when possible.
  - Preserve the `FormatBandData` contract or add versioned endpoints if you need a breaking change.

If anything important is missing or you'd like a different focus (tests, CI, or adding env-based API URLs), tell me which areas to expand. 
