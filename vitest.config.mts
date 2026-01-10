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
    test: {
        environment: 'jsdom',
        globals: true,
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true, // GitHub Actions等の低リソース環境で安定動作させるため
            },
        },
        fileParallelism: false,
        testTimeout: 30000,
    },
});
