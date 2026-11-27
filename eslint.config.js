import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-console': 'error',
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Network requests are forbidden in PRIVAScan.' },
        { name: 'XMLHttpRequest', message: 'Network requests are forbidden in PRIVAScan.' },
        { name: 'WebSocket', message: 'Network requests are forbidden in PRIVAScan.' },
        { name: 'localStorage', message: 'Persistent storage is forbidden in PRIVAScan.' },
        { name: 'sessionStorage', message: 'Persistent storage is forbidden in PRIVAScan.' },
        { name: 'indexedDB', message: 'Persistent storage is forbidden in PRIVAScan.' }
      ],
      'no-restricted-properties': [
        'error',
        { object: 'navigator', property: 'sendBeacon', message: 'Network beacons are forbidden in PRIVAScan.' },
        { object: 'document', property: 'cookie', message: 'Cookies are forbidden in PRIVAScan.' },
        { object: 'window', property: 'fetch', message: 'Network requests are forbidden in PRIVAScan.' },
        { object: 'window', property: 'localStorage', message: 'Persistent storage is forbidden in PRIVAScan.' },
        { object: 'window', property: 'sessionStorage', message: 'Persistent storage is forbidden in PRIVAScan.' }
      ],
    },
  },
);
