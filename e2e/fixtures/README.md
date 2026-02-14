# E2E fixtures

操作説明用のスクリーンショット作成と、E2E検証で利用する fixture 一式です。

- 画像: `e2e/fixtures/images/`
- ウィンドウ設定: `e2e/fixtures/app.config.json`
- シーン定義(JSON): `e2e/fixtures/scenes/`

## シーン一覧

1. Scene 1: 基本画面とメニュー (Home)
   - Scene JSON: `scene01-home.scene.json`
   - 画像: なし (アプリ起動直後)
   - 代表操作: メニューバーを開いて機能一覧を見せる
2. Scene 2: 画像設定 (Image Settings)
   - Scene JSON: `scene02-image-settings.scene.json`
   - 画像: `scene02-01.png` 〜 `scene02-04.png` (4枚)
   - 代表操作: 画像設定ウィンドウを開いて調整操作を見せる
3. Scene 3: 画像変形 (Perspective)
   - Scene JSON:
     - `scene03-perspective-a.scene.json`
     - `scene03-perspective-b.scene.json`
   - 画像: `scene03-01.png`, `scene03-02.png`
   - 状態: 2枚目の透明度違いで2パターン撮影
4. Scene 4: フィルタ適用 (Filters)
   - Scene JSON: `scene04-filters.scene.json`
   - 画像: `scene04-01.png`, `scene04-02.png`
   - 状態: 1枚目に 2値化フィルタを適用
5. Scene 5: コントロールとツールチップ (Controls)
   - Scene JSON: `scene05-controls.scene.json`
   - 画像: `scene05-01.png`, `scene05-02.png`
   - 代表操作: FAB 操作や tooltip 表示
6. Scene 6: 応用・完成イメージ (Final)
   - Scene JSON: `scene06-final.scene.json`
   - 画像: `scene06-01.png`, `scene06-02.png`
   - 状態: 完成イメージ寄りに撮影

## 既定シーン

- `default.scene.json` は E2E のスモーク/共通検証で使う最小シーンです。
- ドキュメント用のシナリオ撮影は上記 Scene 1〜6 の JSON を利用してください。

## 利用例

```ts
import { applyFixtureScene } from "../helpers/electronHarness";

await applyFixtureScene(page, "scene04-filters.scene.json");
```

`source` の `fixture:xxx` は `e2e/fixtures/images/xxx.(png|jpg|jpeg|webp|gif|svg)` を解決します。

## シナリオ撮影E2E

シーンを順番に読み込み、説明用スクリーンショットを出力する専用E2E:

```bash
npm run test:e2e:screenshots
```

- 出力先: `test-results/e2e-screenshots/`
- このE2Eは通常の `npm run test:e2e` では実行されません。
- 主要出力ファイル:
  - `scene01-home.png` / `scene01-home-menu.png`
  - `scene02-main.png` / `scene02-image-settings.png`
  - `scene03-perspective-a.png` / `scene03-perspective-b.png`
  - `scene04-main.png` / `scene04-filters.png`
  - `scene05-controls.png`
  - `scene06-final.png`
