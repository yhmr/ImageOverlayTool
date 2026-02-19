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
        environment: 'node',
        globals: true,
        benchmark: {
            include: [
                'tests/bench/**/*.bench.ts',
                'tests/bench/**/*.bench.tsx',
            ],
            exclude: ['**/node_modules/**'],
        },
    },
});
