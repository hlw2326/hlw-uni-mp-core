import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts', 'src/**/*.d.ts'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: {
        index: './src/index.ts',
      },
      name: 'HlwUniCore',
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: [
        'vue',
        'vue/runtime-dom',
        'pinia',
        '@dcloudio/types',
        /^node:/,
        /^@dcloudio\//,
      ],
    },
    copyPublicDir: false,
    minify: false,
  },
});
