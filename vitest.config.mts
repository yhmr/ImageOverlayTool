import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        react(),
    ],
    // Vitest 4ではpoolOptionsがトップレベルに移動
    // @ts-ignore
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    // Vitest 4ではpoolOptionsがトップレベルに移動
    // @ts-ignore
    poolOptions: {
        forks: {
            singleFork: true, // GitHub Actions等の低リソース環境で安定動作させるため
        },
    },
    test: {
        dir: 'tests',
        environment: 'node', // 現在のテストはDOM不要なのでnodeで実行
        globals: true,
        testTimeout: 30000,
        coverage: {
            provider: 'v8',
            enabled: true,
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './coverage',
            exclude: ['**/node_modules/**', '**/dist/**', '**/out/**', '**/*.d.ts', '**/tests/**'],
        },
    },
});
