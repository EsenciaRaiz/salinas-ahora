import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

function initialGuideData() {
  return {
    name: 'initial-guide-data',
    transformIndexHtml(html: string) {
      try {
        const data = JSON.parse(readFileSync('public/guide-data.json', 'utf8'));
        if (!data?.correcto || !Array.isArray(data.negocios)) return html;
        const safeJson = JSON.stringify(data).replace(/</g, '\\u003c');
        return html.replace('</head>', `<script id="initial-guide-data" type="application/json">${safeJson}</script></head>`);
      } catch {
        return html;
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), initialGuideData()],
});
