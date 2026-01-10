import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        react({
            jsxImportSource: '@emotion/react',
            babel: {
                plugins: ['@emotion/babel-plugin'],
            },
        }),
    ],
    // Vitest 4ではpoolOptionsがトップレベルに移動
    poolOptions: {
        forks: {
            singleFork: true, // GitHub Actions等の低リソース環境で安定動作させるため
        },
    },
    test: {
        environment: 'node', // 現在のテストはDOM不要なのでnodeで実行
        globals: true,
        testTimeout: 30000,
    },
});
