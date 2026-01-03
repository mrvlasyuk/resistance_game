# Resistance Game (Host Helper) — Agent Notes

This repo is a small Vite + React + TypeScript web app that helps a group play **The Resistance** on a shared phone/tablet (the “host helper” device). It’s designed for **in-person/offline** play: players pass the device around for private role reveals and mission-card voting, while the host records outcomes.

## Quick start

- Install deps: `npm install`
- Dev server: `npm run dev`
- Run tests: `npm test`
- Production build: `npm run build`
- Preview build: `npm run preview`

## Tech stack

- Vite + React 18 + TypeScript
- State: `zustand` with `persist` to `localStorage`
- Styling: Tailwind (see `src/index.css`)
- Tests: Jest + Testing Library (`@testing-library/react`)

## Game flow (phases)

Phases are defined in `src/types/game.ts` as `GamePhase` and rendered in `src/App.tsx`.

Current phase order:

1. `lobby`
2. `name-entry` (players enter names + private role reveal per player)
3. `spy-intro` (host reminder to do the “spies wake up” intro in real life)
4. `captain`
5. `team-select`
6. `team-vote`
7. `mission-vote`
8. `mission-result`
9. `victory`

Key screens live in `src/screens/*`.

## Privacy/safety rules implemented

- **Mission cards UI parity:** Everyone sees both Success/Fail cards to avoid “who is a spy” leaking via UI. Resistance clicking Fail shows a message, but cannot select it (store also enforces this).
  - UI: `src/screens/MissionVote.tsx`
  - Store guard: `submitVote` in `src/store/gameStore.ts` normalizes Resistance votes to `success`.
- **Reveal red cards without leaking extra spies:** If a mission fails, the UI reveals only the *minimum* number of Fail cards required to fail the mission (1 normally, 2 on mission 4 with 7+ players). Extra Fail votes are shown as Success in the reveal.
  - Logic: `getFailThreshold` + `getPublicMissionVoteCounts` in `src/utils/gameLogic.ts`
  - UI: `src/screens/MissionResult.tsx` uses `getPublicMissionVoteCounts`
- **Undo/back restrictions:** Host can go back for mis-clicks on host phases, but:
  - No going back into role-reveal (`name-entry`) to avoid seeing previous roles.
  - No undo after any mission vote has been cast (cannot “unvote”).
  - Undo is supported for: captain navigation, team proposal, team approval/rejection, and victory-by-5-rejections (host misclick).
  - Store: `history`, `canGoBack`, `goBack` in `src/store/gameStore.ts`
  - UI button: `src/components/BackButton.tsx` (mounted globally in `src/App.tsx`)

## Captain timeline / host info

The host/team gets extra context on team selection/vote screens:

- Current captain
- Next 3 captains (by turn order)
- Remaining team rejections in the current mission (max 5)
- A simple emoji “timeline” of captain attempts and mission outcomes (with public card counts)

Implementation:

- Logged data: `captainTurns` in `src/types/game.ts` + updated in `src/store/gameStore.ts` on:
  - `selectTeam` (creates a `proposed` turn)
  - `approveTeam` (marks `approved`)
  - `rejectTeam` (marks `rejected`)
  - `resolveMissionResult` (marks `mission-success` / `mission-fail` + stores `revealed` counts)
- UI: `src/components/CaptainTimeline.tsx`
- Embedded in: `src/screens/TeamSelect.tsx` and `src/screens/TeamVote.tsx`

## Name suggestions (nicknames)

Nicknames entered during `name-entry` are stored and suggested in future games:

- Stored in persisted state as `savedNames` (case-insensitive de-dupe, capped to 200).
- Not cleared by `resetGame()` (new game keeps suggestions).
- UI suggests names after typing **2+ characters**; click a suggestion to fill.
  - Store: `addSavedName` + `savedNames` in `src/store/gameStore.ts`
  - UI: `src/screens/NameEntry.tsx`

## Persistence details

`zustand/persist` stores state in:

- Key: `resistance-game-state` (see `src/store/gameStore.ts`)
- Includes: phase, players, missions, captain index, rejected count, winner, language, `savedNames`, `captainTurns`, etc.

Notes:

- `resetGame()` intentionally keeps `savedNames`, but resets everything else.
- On hydration, there is a safety check to resolve mission result if all votes were already cast.

## Tests

Run: `npm test`

Where tests live:

- Store tests: `src/store/__tests__/*`
  - `gameStore.test.ts`: basic actions and persistence expectations
  - `gameStore.mechanics.test.ts`: larger integration-style mechanics incl. undo constraints
  - `captainTurns.test.ts`: logging of captain turns and revealed cards
- Logic tests: `src/utils/__tests__/gameLogic.test.ts`
- Screen tests: `src/screens/__tests__/*` (Lobby/NameEntry/MissionVote/MissionResult/SpyIntro)

Known noisy output:

- Some tests print React’s act() deprecation warning due to Testing Library internals; tests still pass.
- `ts-jest` warns about `esModuleInterop` (not currently enabled).

## CI / common pitfalls (avoid repeating)

- **Always run a full build before pushing:** CI runs `npm run build` (`tsc && vite build`) and will fail on TypeScript diagnostics that Jest does not catch (e.g. `noUnusedLocals` / TS6133 “declared but never read”).
  - Recommended pre-push: `npm test && npm run build`
- **Why tests may pass while CI build fails:** Jest/ts-jest only type-checks/compiles files that are imported by tests; it does **not** necessarily run `tsc` across the entire project. A new file/component can have TS errors and still let `npm test` pass.
- **TypeScript strictness is real:** `tsconfig.json` has `noUnusedLocals: true` and `noUnusedParameters: true`. Don’t leave unused selectors/vars in React components (especially after removing UI pieces).

## Translations / copy

Translations are JSON in:

- `src/i18n/en.json`
- `src/i18n/ru.json`

`useTranslation` is in `src/hooks/useTranslation.ts` and supports nested keys + `{{param}}` replacement.

If you add new UI strings:

1. Add key to both JSON files.
2. Use `t('some.key')` in components.
3. Update/make tests if they mock translations.

## Commit / push workflow

This repo uses a normal GitHub remote named `origin`.

Typical flow:

- Check changes: `git status`
- Run tests/build before pushing: `npm test && npm run build`
- Stage: `git add -A`
- Commit: `git commit -m "Your message"`
- Push: `git push origin main`

## Design intent / product constraints

- Avoid UI cues that leak roles (e.g., disabled buttons, color differences).
- Keep the game playable on a shared device passed around.
- Prefer store-level enforcement for rules (UI should be friendly but not relied on for correctness).
- If adding new features that change the game flow, add tests at the store/logic layer first, then UI tests as needed.
