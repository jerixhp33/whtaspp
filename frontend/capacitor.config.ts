import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chatflow.app',
  appName: 'ChatFlow',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Contacts: {
      permissionType: 'contacts'
    }
  }
};

export default config;
