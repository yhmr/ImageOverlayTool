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
        environment: 'node',
        globals: true,
        testTimeout: 30000,
        include: [
            'integration/**/*.int-test.ts',
            'integration/**/*.int-test.tsx',
        ],
        exclude: ['**/node_modules/**'],
        coverage: {
            provider: 'v8',
            enabled: false,
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './test-results/coverage-int',
            exclude: ['**/node_modules/**', '**/dist/**', '**/out/**', '**/*.d.ts', '**/tests/**'],
        },
    },
});
