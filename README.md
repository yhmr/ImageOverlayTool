# ImageOverlayTool

![Version](https://img.shields.io/github/package-json/v/yhmr/ImageOverlayTool?color=blue&label=version)
[![Microsoft Store](https://img.shields.io/badge/Microsoft%20Store-0078D7?style=flat&logo=microsoft&logoColor=white)](https://apps.microsoft.com/store/detail/9PBQ7VPKTXQ1?cid=DevShareMCLPCS)
![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg)

**ImageOverlayTool** は、Electron と React で構築された、画像の重ね合わせ調整用デスクトップアプリケーションです。
複数の画像をキャンバス上に読み込み、透明度を調整しながら精密な位置合わせや比較を行うことができます。開発者の画像検証作業や、デザインの比較調整をサポートします。

## ✨ 主な機能

- **マルチレイヤーサポート**: 複数の画像を同時に読み込み、ドラッグ&ドロップでレイヤー順序を自由に変更できます。
- **直感的な操作**:
  - **移動**: 画像をドラッグしてスムーズに移動。
  - **変形**: 画像の四隅にあるアンカーを操作して、自由変形（パースペクティブ補正など）が可能。
  - **ズーム**: マウスホイールでステージ全体を拡大・縮小。
- **画像設定ウィンドウ**: 画像のリスト表示、並べ替え、透過度・拡大/縮小・回転・フィルタ調整を独立したウィンドウで管理できます。
  - ショートカット `Ctrl+I` (`Cmd+I`) またはメニューから素早くアクセス可能。
  - メインウィンドウと設定ウィンドウの状態はリアルタイムに同期されます。
- **画像フィルタ**: 2値化やHSV（色相・彩度・明度）調整などの画像処理フィルタを適用できます。
- **寸法線描画**: キャンバス上に寸法線を描画し、解像度係数を考慮した実寸法表示が可能です。
- **Undo/Redo**: `Ctrl+Z` / `Ctrl+Shift+Z`（または `Ctrl+Y`）で操作履歴の元に戻す・やり直しが可能です。
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
- Node.js v20.0.0 以上
- pnpm v10 以上

### インストール
```bash
# 依存関係のインストール
pnpm install
```

## 💻 開発・ビルド

```bash
# 開発モード（Main/Renderer 双方の監視とHMRを有効化）
pnpm run dev

# 本番用ビルド（out フォルダに成果物を生成）
pnpm run build

# Windows 向けパッケージング (.exe / .zip)
pnpm run build:win

# Linux 向けパッケージング (.AppImage / .deb)
pnpm run build:linux

# テスト実行
pnpm test

# 単体テストのみ
pnpm run test:unit

# 結合テストのみ
pnpm run test:integration

# パフォーマンスベンチ（Vitest bench）
pnpm run bench
pnpm run bench:renderer
pnpm run bench:main
pnpm run bench:baseline
pnpm run bench:compare

# E2Eテスト
pnpm run test:e2e

# シナリオ別スクリーンショット撮影（通常のtest:e2e/CIでは自動実行されない）
pnpm run test:e2e:screenshots
```

- テスト作法の基準は `tests/TESTING_GUIDELINES.md` を参照

### ベンチ運用フロー

- bench:compare（baselineとの比較）のタイミング
  - PR作成前など
  - CI（`main` への push / PR）
  - 最適化作業中
- bench:baseline（baseline更新）のタイミング
  - 最適化を意図して性能が変わったとき
  - 仕様変更により計測対象の処理量そのものが変わったとき

### テストセレクタ（data-testid）規約

E2E/統合テストで使用する `data-testid` は、以下の形式で命名します。

- 形式: `<screen>.<area>.<action>`
- 例: `main.menu.item.save-project`, `settings.image-list.add`
- 主要操作UIには `data-testid` を必須化し、`eslint` の `require-data-testid` / `require-component-testid` ルールで検知します（`pnpm run lint`）。

原則として、文言や表示順に依存するセレクタは使わず、主要操作は `data-testid` で参照します。

### E2E制御プレーン

`--e2e` 起動時は、テスト用の制御APIが利用できます。

- `window.__IOT_E2E__.setScene(scene)` : シーンJSONをストアへ注入
- `window.__IOT_E2E__.loadFixtureImage(source)` : fixture画像を追加
- `window.__IOT_E2E__.waitStable({ timeoutMs })` : 描画安定化待ち
- `window.__IOT_E2E__.capture({ mode })` : E2E用キャプチャ保存

シナリオ撮影用の `e2e/screenshot-scenarios.spec.ts` は、
`IOT_E2E_SCREENSHOT_SCENARIOS=1` のときのみ有効になります。
通常の `pnpm run test:e2e` / CI実行では除外されます。

`pnpm run test:e2e:screenshots` は、毎回 `pnpm run build` を先に実行し、ビルド成功時のみ撮影を実行します。
CI上で明示実行された場合も既定ではスキップし、必要時のみ `IOT_E2E_SCREENSHOT_FORCE_IN_CI=1` で強制実行します。

fixture解決ルール:

- `fixture:alias` は `e2e/fixtures/images/<alias>.(png|jpg|jpeg|webp|gif|svg)` を探索
- 相対パスは `e2e/fixtures/` 基準で解決
- 絶対パスはそのまま利用

セキュリティ境界:

- E2E制御は `--e2e` と `IOT_E2E_MODE=1` の両方が有効なときのみ動作
- 通常起動/リリースビルドでは無効

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
│   ├── bench/          # パフォーマンスベンチ（*.bench.ts / *.bench.tsx）
│   ├── unit/           # 単体テスト（*.spec.ts / *.spec.tsx）
│   │   ├── main/
│   │   └── renderer/
│   └── integration/    # 結合テスト（*.int-test.ts / *.int-test.tsx）
│
└── scripts/        # ビルド・補助スクリプト
```

## ⚠️ 開発上の注意点

- **ローカルファイルの読み込み**: セキュリティ制限により、ローカル画像を表示する際は `local-file://[絶対パス]` 形式のカスタムプロトコルを使用しています。
- **型定義**: `window.electronAPI` などの独自APIは `src/renderer/env.d.ts` で定義されています。

## 📄 ライセンス

このプロジェクトは [AGPL-3.0](LICENSE) ライセンスの下で公開されています。
