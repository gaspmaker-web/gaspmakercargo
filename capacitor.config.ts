import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gaspmakercargo.app',
  appName: 'Gasp Maker',
  webDir: 'out',
  server: {
    url: 'https://www.gaspmakercargo.com',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Geolocation: {
      permissions: {
        location: 'whenInUse',
      },
    },
  },
};

export default config;
