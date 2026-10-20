// Typed public env vars. Only EXPO_PUBLIC_* values are inlined into the bundle; read them through src/config/env.ts.
declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_SUPABASE_URL?: string;
    readonly EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
    readonly EXPO_PUBLIC_DEV_SKIP_CONSENT_GATE?: string;
  }
}
