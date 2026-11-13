/** Haptic feedback – uses the Vibration API on web, Capacitor Haptics when wrapped natively. */
export function haptic(kind: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light'): void {
  try {
    const cap = (
      window as unknown as {
        Capacitor?: { Plugins?: { Haptics?: { impact: (o: { style: string }) => void } } };
      }
    ).Capacitor;
    if (cap?.Plugins?.Haptics) {
      cap.Plugins.Haptics.impact({
        style: kind === 'light' ? 'LIGHT' : kind === 'heavy' ? 'HEAVY' : 'MEDIUM',
      });
      return;
    }
    if (navigator.vibrate) {
      const pattern = {
        light: 8,
        medium: 15,
        heavy: 25,
        success: [10, 30, 10],
        error: [30, 40, 30],
      }[kind];
      navigator.vibrate(pattern);
    }
  } catch {
    /* ignore */
  }
}
