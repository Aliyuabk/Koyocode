import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'Kcode',
  webDir: 'public',
  server: {
    url: 'https://koyocodeng.vercel.app', // 👈 Links your live site
    cleartext: true
  }
};

export default config;
