import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const platformBaseUrl = env.VITE_PLATFORM_BASE_URL || 'http://192.168.11.51:9884';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/pano': {
          target: platformBaseUrl,
          changeOrigin: true
        },
        '/panoramic': {
          target: platformBaseUrl,
          changeOrigin: true
        }
      }
    }
  };
});
