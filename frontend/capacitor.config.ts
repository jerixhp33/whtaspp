import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chatflow.messenger',
  appName: 'ChatFlow',
  webDir: 'dist',
  backgroundColor: '#09090b',
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
