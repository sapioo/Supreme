import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    optimizeDeps: {
      include: ['@vapi-ai/web', 'events'],
    },

    server: {
      proxy: {
        // NVIDIA NIM API
        // /api/nvidia/v1/chat/completions → https://integrate.api.nvidia.com/v1/chat/completions
        '/api/nvidia': {
          target: 'https://integrate.api.nvidia.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/nvidia/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // Ensure Authorization header is forwarded (not stripped)
              proxyReq.setHeader('Accept', 'application/json');
            });
            proxy.on('error', (err) => {
              console.error('[Proxy/NVIDIA] Error:', err.message);
            });
          },
        },

        // Qdrant Cloud
        // /api/qdrant/collections/... → https://<cluster>/collections/...
        '/api/qdrant': {
          target: env.VITE_QDRANT_URL || 'https://localhost',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/qdrant/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.error('[Proxy/Qdrant] Error:', err.message);
            });
          },
        },
      },
    },
  };
});
