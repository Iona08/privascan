import { defineConfig, loadEnv, type Plugin } from 'vite';
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const vercel = env.VERCEL ?? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VERCEL;
  const viteBase = env.VITE_BASE ?? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITE_BASE;
  const githubPages = env.GITHUB_PAGES ?? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.GITHUB_PAGES;

  let base = '/';
  if (viteBase) {
    base = viteBase;
  } else if (vercel) {
    base = '/';
  } else if (githubPages === 'true') {
    base = '/privascan/';
  }

  return {
    base,
    plugins: [react(), tailwindcss(), productionCspPlugin()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
