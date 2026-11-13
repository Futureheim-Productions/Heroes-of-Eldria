import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor wrapper config (Implementation Plan §7, point 64).
 * Install with: npm i @capacitor/core @capacitor/cli && npx cap add android/ios
 * Landscape lock must also be set in AndroidManifest.xml (android:screenOrientation="sensorLandscape")
 * and Info.plist (UISupportedInterfaceOrientations) once the native projects are generated.
 */
const config: CapacitorConfig = {
  appId: 'se.fantasyquest.app',
  appName: 'Heroes of Eldria',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: { launchShowDuration: 1500, backgroundColor: '#0f0c1a', showSpinner: false },
    StatusBar: { style: 'DARK', overlaysWebView: true },
  },
};

export default config;
