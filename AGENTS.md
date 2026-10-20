This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Dog OS project rules

Adapted from the ECC React Native / Expo rule set (security, accessibility, production readiness, database migrations) to this codebase.

### Architecture
- Feature code lives in `src/features/<feature>/` (`api.ts` = Supabase calls, `hooks.ts` = React Query hooks, screens/components). Route files in `src/app/` stay thin and only render feature screens.
- Modular, single-responsibility files:
  - Keep UI components, pure business logic and API calls in separate files: one component per file, logic in plain tested modules.
  - Give every exported function a one-line comment saying what it's for.
  - Split a file once it holds more than one screen or concern. Reference layout:
    - `features/health` (`logic/`, `records/`, `encyclopedia/`, `symptoms/`, `forms/`)
    - `features/chat` (`logic/`, `components/`, `useChatConversation.ts`)
    - `features/dashboard` (`api.ts`, `hooks.ts`, `logic/`, `components/`)
    - `features/training` (`logic/`, `academy/`, `encyclopedia/`)
    - `features/dogs/form/`, `features/auth/signIn/` (screen + `use…Form` hook + pure `…Logic.ts`)
    - `components/ui/select/`
  - Shared form feedback uses `FeedbackBanner` from `components/ui`.
- Before writing code, present the folder structure of the files to be added or changed.
- Shared UI comes from `src/components/ui`; colors, spacing and type from `src/theme`. Don't hard-code colors or font sizes in features.
- All server state goes through React Query with keys from `queryKeys` in `src/lib/queryClient.ts`; invalidate the matching key after every mutation.
- The app is Hebrew-only and RTL. Use logical layout props (`start`/`end`, `paddingStart`), never `left`/`right`, and keep user-facing copy in Hebrew.

### Security
- The JS bundle is public. Only `EXPO_PUBLIC_SUPABASE_URL` and the publishable key may ship; they are read and validated in `src/config/env.ts`. Secret keys, the DB password and `ANTHROPIC_API_KEY` exist only as Supabase Edge Function secrets.
- Authorization is enforced by RLS, never by the client. Every new table: `user_id default auth.uid()`, RLS enabled, per-command policies on `(select auth.uid()) = user_id`, explicit `grant` to `authenticated`, `revoke all … from anon`. Dog-owned rows use the composite FK `(dog_id, user_id) → dogs (id, user_id)`.
- Content clients must not forge (chat assistant messages, AI insights) is written only by Edge Functions with the service role.
- Validate all external input: request bodies in Edge Functions, Edge Function responses and route params in the app. Never show raw server/database errors to users – use `toUserMessage`.
- Session storage:
  - Native: the Supabase session lives only in the hardware keystore (`src/lib/sessionStorage.ts`, via `expo-secure-store`). Values are chunked under 2 KB with a crash-safe commit manifest (`chunkedSecureStorage.ts`), and old plaintext sessions are migrated and deleted.
  - Web: browsers have no keystore, so the session is in localStorage. That's why the app loads no third-party scripts.
- AI data sharing is opt-out (consent type `ai_data_sharing`):
  - The server enforces it in every AI Edge Function with `aiDataSharingAllowed()` → `public.ai_data_sharing_allowed()`, failing closed.
  - The client mirrors it with `useAiSharing`. A new AI feature must check both.
  - React Query `refetch()` ignores `enabled`, so gate manual refetches too.
- Logging:
  - App code may not use `console` (ESLint `no-console`); report through `reportError`, whose sink only receives `sanitizeError` output.
  - Edge Functions log only through `logError`, which redacts and truncates.
- Development consent bypasses exist only under `__DEV__`, never write consent records, and always show `DevSchemaWarning`. They cover a missing consent table and the `EXPO_PUBLIC_DEV_SKIP_CONSENT_GATE=1` switch.

### Database migrations
- Every schema change is a new file in `supabase/migrations/`. Never edit a migration that has been applied to the project; fix forward with a new migration.
- New columns on existing tables are nullable or have a default. Keep large data backfills separate from DDL.
- After adding a migration, update `src/lib/database.types.ts` (or regenerate it once the CLI is linked).

### Accessibility (WCAG 2.1 AA / IS 5568)
- Every interactive element has `accessibilityRole` plus a label (visible text or `accessibilityLabel`); icon-only buttons always have `accessibilityLabel`. Expose state with `accessibilityState`.
- Touch targets ≥ 44pt (`MIN_TOUCH`). Don't use fixed heights that clip scaled text.
- Text contrast ≥ 4.5:1, control boundaries ≥ 3:1 – only use `src/theme` colors, which are verified. Never convey meaning by color alone (pair urgency colors with text/icons).
- Errors and async results are announced (`accessibilityRole="alert"` / `accessibilityLiveRegion`). Images have `accessibilityLabel` / `alt`.
- Web: everything must be reachable and operable with the keyboard; the global `:focus-visible` outline must stay.

### Legal & compliance
- Payments, if ever added, go only through an external PCI DSS processor or app-store billing. Card data never touches our code, Edge Functions or database. Show prices with `PriceDisclosure`.
- No affiliate links, ads, testimonials or ratings unless they are real and clearly labelled; update the terms (§8א) when that changes.
- Adding or removing a dependency, font or icon set: update the `licenses` document in `src/features/legal/documents.ts`. No stock images without a recorded license.
- No third-party scripts, embeds or trackers. Anything non-essential on web loads only if `canLoadAnalytics()` is true, and must be listed in the cookie policy.
- New user-data tables are added to `USER_TABLES` in `src/features/account/api.ts` (data export) and cascade on user deletion.
- When a sign-up consent document changes materially, bump its `LEGAL_VERSIONS` entry so users re-consent.
- The privacy-policy claims (30-day inactivity sign-out, rate limits, what the AI receives) must match the code: `sessionGuards.ts`, the chat function and `AdvisorContextScreen`.

### AI & medical content
- Medical/training content is informational. Screens showing it keep the disclaimer; the symptom checker never presents a diagnosis, and the app never computes medication doses.

### Reliability
- Every route file in `src/app` (except `+not-found.tsx`) exports `export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';`. A test enforces this.
- Code that runs at module load must not throw. Config is validated into a result (`readSupabaseEnv`) and the root layout renders `ConfigErrorScreen` when it's invalid.
- Unexpected errors go through `reportError(error, where)` (`src/utils/errors.ts`). It must never receive user content or identifiers.
- Failures the user can't otherwise see, such as optimistic rollbacks, use `showToast`. Every mutation's failure must reach the user, inline or by toast.
- Multi-step writes: once the primary row exists, secondary steps (photo, activation) must not fail the operation, so retries can't duplicate data. See `saveDog`.
- Privacy gates fail closed: if consent can't be verified, the user waits at a retry screen (`consentGate`).
- Validate route and enum strings with own-property checks (`Object.prototype.hasOwnProperty.call`), never `in`.

### Motion
- Use `src/components/motion.tsx`: `PressableScale` for pressable surfaces, `enterAt(i)` for list entries, and `Screen`'s `parallaxHeader` for scroll headers.
- Animate only transform and opacity on the UI thread with Reanimated 4, using `.get()`/`.set()` on shared values.
- Everything honours reduced motion (`useReducedMotion` / `ReduceMotion.System`). Never fade text below readable contrast.

### Testing
- Jest (`jest-expo` preset) + React Native Testing Library v14. Tests live in `__tests__/` next to the code, and typed fixtures are in `src/test/fixtures.ts`.
- RNTL v14: `await render(...)`, query through `screen`, prefer `getByRole`, use `userEvent`. Read `node_modules/@testing-library/react-native/docs/guides/llm-guidelines.md`.
- Every change ships with tests for its logic and its failure paths. Put side-effect orchestration behind injectable operations (like `SaveDogOps`) so it is unit-testable without a network.
- Edge Functions (Deno) are not covered by Jest, except pure helpers (no Deno APIs) tested from `supabase/tests/`.
- Reanimated runs under Jest through its resolver plus `setUpTests()` (`jest.setup-after-env.ts`).
- `src/components/__tests__/accessibilityGuards.test.ts` statically enforces:
  - roles on every pressable;
  - alt text on images;
  - decorative-or-labelled icons;
  - labels on every IconButton and TextInput;
  - no capped font scaling.
- `touchTargets.test.tsx` enforces 44pt touch targets.
- Run Jest with capped workers (`--maxWorkers=2` in the hook, `50%` by default): the machine runs the dev server too.

### Done = verified
- `npm run verify` (tsc, `expo lint`, jest) must pass, plus a web bundle build (`npx expo export --platform web`), before declaring a task done.
- Pre-release gate (not yet in place): `npx expo-doctor`, crash reporting (e.g. Sentry), EAS build profiles, and a screen-reader walkthrough of sign-up, dog creation, chat and the symptom checker.
