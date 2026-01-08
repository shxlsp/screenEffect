import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';
import { rename } from 'fs/promises';

/**
 * 重命名输出的 HTML 文件为 effect.html
 */
function renameHtmlPlugin(): Plugin {
  return {
    name: 'rename-html',
    closeBundle: async () => {
      try {
        await rename(
          resolve(__dirname, 'dist/index.html'),
          resolve(__dirname, 'dist/effect.html')
        );
        console.log('✅ 已重命名 index.html -> effect.html');
      } catch (e) {
        // 文件可能已经被重命名或不存在
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), viteSingleFile(), renameHtmlPlugin()],
  define: {
    'import.meta.env.IS_TEST': JSON.stringify(process.env.IS_TEST === 'true'),
    'import.meta.env.MODE': JSON.stringify(process.env.MODE || 'development'),
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'effect.js',
      },
    },
    // 单文件输出配置
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  },
});

