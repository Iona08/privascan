import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function productionCspPlugin(): Plugin {
  return {
    name: 'privascan-production-csp',
    apply: 'build',
    transformIndexHtml(html) {
      const cspTag =
        '    <meta http-equiv="Content-Security-Policy" content="default-src \'self\'; style-src \'self\' \'unsafe-inline\'; script-src \'self\'; img-src \'self\' data: blob:; connect-src \'none\'; object-src \'none\'; base-uri \'self\'; form-action \'none\';" />\n';
      return html.replace('  </head>', `${cspTag}  </head>`);
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/privascan/' : '/',
  plugins: [react(), tailwindcss(), productionCspPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
}));
