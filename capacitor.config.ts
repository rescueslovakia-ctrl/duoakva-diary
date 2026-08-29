import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'sk.duoakva.diary',
  appName: 'DuoAkva Diary',
  webDir: 'mobile-web-placeholder',
  server: {
    url: 'https://diary.duoakva.sk',
    cleartext: false,
    allowNavigation: ['diary.duoakva.sk', '*.supabase.co'],
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
    },
  },
};

export default config;
