export type GlassMode = 'blur' | 'solid';

/**
 * How a glass surface renders. Android gets an opaque fill: expo-blur's Android blur is experimental and
 * costly. Users who turned on "Reduce Transparency" (iOS) get the opaque fill too.
 */
export function pickGlassMode(platform: string, reduceTransparency: boolean): GlassMode {
  if (reduceTransparency || platform === 'android') return 'solid';
  return 'blur';
}
