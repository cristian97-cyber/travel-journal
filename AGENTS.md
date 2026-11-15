# Repository Guidelines

## Project Structure & Module Organization

Application code lives in `src/app/`. Route-level features are grouped under `pages/` (for example, `pages/home/`), reusable presentation logic belongs in `shared/`, and application infrastructure is under `core/`:

- `pages/home/` lists and imports trips; `pages/trip-detail/` renders a saved itinerary.
- `shared/components/` contains the application header and footer.
- `core/models/` defines the separate `Trip`, `TripDay`, and `TripStop` domain types.
- `core/data/` owns IndexedDB/Dexie persistence and repositories.
- `core/services/` contains workflows such as ZIP import.
- `core/state/` manages client-side application state with Angular Signals.

Global styles are in `src/styles.scss`; component templates and SCSS stay beside their `.ts` files. Static files copied unchanged belong in `public/`. Unit tests use the `*.spec.ts` suffix and should be colocated with the code they cover. Production output is generated in `dist/` and must not be committed.

The app uses standalone components and lazy route loading configured in `app.routes.ts`. Keep page-specific behavior in its page, but reuse shell UI through `shared/components/` and keep data access out of components.

## Data & Import Conventions

Trips are stored only in the browser in the Dexie database named `travel-journal`; `TripRepository` is the persistence boundary and `TripStore` coordinates loading, importing, lookup, and removal. Changes to the Dexie schema require a new database version and an upgrade path for existing local data.

Trip imports are ZIP archives of at most 50 MB containing a `trip.json` file at any directory level. `TripImportService` validates the JSON with Ajv, normalizes supported aliases such as `name`/`title` and `notes`/`description`, generates missing IDs, and sorts days chronologically. Keep validation and normalization in this service, and add tests whenever the accepted import contract changes.

## Build, Test, and Development Commands

Install the locked dependency set with `npm install`. Common commands are:

- `npm start` — run the development server at `http://localhost:4200/` with live reload.
- `npm run build` — create an optimized production build and enforce Angular bundle budgets.
- `npm run watch` — continuously rebuild using the development configuration.
- `npm test` — execute unit tests through Angular's Vitest-based test runner.

Run the build and tests before opening a pull request.

## Coding Style & Naming Conventions

Follow `.editorconfig`: two-space indentation, UTF-8, final newlines, and single quotes in TypeScript. Use Prettier-compatible formatting. No lint script is currently configured, so treat TypeScript compiler and Angular build errors as mandatory fixes.

Use kebab-case filenames with role suffixes, such as `trip-detail.page.ts`, `trip.store.ts`, and `date-range.pipe.ts`. Use PascalCase for classes and interfaces, camelCase for variables and functions, and descriptive Angular selectors with the `app-` prefix. Keep components focused; move persistence, imports, and shared state into `core/` rather than page components.

## Testing Guidelines

Write Vitest-compatible Angular tests with `TestBed`, `describe`, and `it`. Name tests after observable behavior (for example, `it('should render the brand')`). Add coverage for new state transitions, repository behavior, import validation, and important rendered UI states. There is no formal coverage threshold; prioritize regression-prone paths and run `npm test` locally.

No end-to-end test runner is configured. Do not rely on the generated README's `ng e2e` example unless an e2e framework is added to the project first.

## Commit & Pull Request Guidelines

Existing commits use short, imperative summaries such as `Replace Angular starter screen with travel journal placeholder`. Keep each commit focused and avoid mixing refactors with behavior changes. Pull requests should explain the user-facing change, summarize implementation and test evidence, link any relevant issue, and include screenshots for visible UI changes. Call out schema, import-format, or persistence changes explicitly because they may affect existing local data.
