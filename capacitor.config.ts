import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bxplayer.app',
  appName: 'BX Player',
  webDir: 'out',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  server: {
    url: 'http://192.168.100.11:3000',
    cleartext: true
  }
};

export default config;
