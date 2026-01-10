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
        pool: 'forks', // CIでのハングアップ防止のためフォークを使用
        fileParallelism: false, // テストファイルの並列実行を無効化（CIでのハングアップ回避の最終手段）
    },
});
