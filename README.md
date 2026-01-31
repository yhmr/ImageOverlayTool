# ImageOverlayTool

![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)
![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg)

**ImageOverlayTool** は、Electron と React で構築された、画像の重ね合わせ調整用デスクトップアプリケーションです。
複数の画像をキャンバス上に読み込み、透明度を調整しながら精密な位置合わせや比較を行うことができます。開発者の画像検証作業や、デザインの比較調整をサポートします。

## ✨ 主な機能

- **マルチレイヤーサポート**: 複数の画像を同時に読み込み、ドラッグ&ドロップでレイヤー順序を自由に変更できます。
- **直感的な操作**:
  - **移動**: 画像をドラッグしてスムーズに移動。
  - **変形**: 画像の四隅にあるアンカーを操作して、自由変形（パースペクティブ補正など）が可能。
  - **ズーム**: マウスホイールでステージ全体を拡大・縮小。
- **画像設定ウィンドウ**: 画像のリスト表示、並べ替え、透過度調整を独立したウィンドウで管理できます。
  - ショートカット `Ctrl+I` (`Cmd+I`) またはメニューから素早くアクセス可能。
  - メインウィンドウと設定ウィンドウの状態はリアルタイムに同期されます。
- **カスタマイズ**: コンテキストメニューからキャンバスの背景色（ウィンドウの背景）を変更可能。
- **設定の永続化**: ウィンドウサイズ、表示位置、背景色、言語設定などは自動的に保存され、次回起動時に復元されます。

## 🛠 技術スタック

このプロジェクトは以下の技術スタックで構築されています：

- **Core**: [Electron](https://www.electronjs.org/), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Zustand](https://zustand.docs.pmnd.rs/)
- **Canvas Rendering**: [Konva](https://konvajs.org/) / [react-konva](https://konvajs.org/docs/react/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) / [shadcn/ui](https://ui.shadcn.com/)
- **Build Tool**: [electron-vite](https://electron-vite.org/)
- **Testing**: [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/)

## 🚀 セットアップ

### 前提条件
- Node.js v18.0.0 以上

### インストール
```bash
# 依存関係のインストール
npm install
```

## 💻 開発・ビルド

```bash
# 開発モード（Main/Renderer 双方の監視とHMRを有効化）
npm run dev

# 本番用ビルド（out フォルダに成果物を生成）
npm run build

# Windows 向けパッケージング (.exe / .zip)
npm run build:win

# Linux 向けパッケージング (.AppImage / .deb)
npm run build:linux

# テスト実行
npm test
```

## 📁 ディレクトリ構成

electron-vite の標準的な構成に基づき、コードの分離を行っています。

```
.
├── src/
│   ├── main/           # Electron メインプロセス
│   │   ├── index.ts        # アプリエントリポイント
│   │   ├── ipc/            # IPC通信ハンドラ
│   │   ├── repositories/   # データアクセス層
│   │   ├── windows/        # ウィンドウ管理
│   │   └── utils/          # メインプロセス用ユーティリティ
│   │
│   ├── preload/        # Preload スクリプト
│   │
│   ├── renderer/       # React レンダラープロセス
│   │   ├── main-window/    # メインウィンドウ UI
│   │   ├── image-settings/ # 画像設定ウィンドウ UI
│   │   ├── hooks/          # カスタムHooks
│   │   ├── store/          # Zustand ストア定義
│   │   ├── services/       # 外部通信・副作用の抽象化
│   │   ├── components/     # 共通UIコンポーネント
│   │   └── env.d.ts        # レンダラープロセス用型定義
│   │
│   ├── shared/         # プロセス間共有コード
│   │   └── types/          # 共通型定義
│   │
│   └── i18n/           # 多言語対応リソース
│
├── tests/          # テストコード（Vitest）
│   ├── main/           # メインプロセスのユニットテスト
│   └── renderer/       # レンダラープロセスのユニットテスト
│
└── scripts/        # ビルド・補助スクリプト
```

## ⚠️ 開発上の注意点

- **ローカルファイルの読み込み**: セキュリティ制限により、ローカル画像を表示する際は `local-file://[絶対パス]` 形式のカスタムプロトコルを使用しています。
- **型定義**: `window.electronAPI` などの独自APIは `src/renderer/env.d.ts` で定義されています。

## 📄 ライセンス

このプロジェクトは [AGPL-3.0](LICENSE) ライセンスの下で公開されています。