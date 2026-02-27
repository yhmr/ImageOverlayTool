# Scene Input v1 仕様（Phase 1）

- Status: Draft
- Date: 2026-02-24
- Related: #82（CLI起動オプション拡充。Phase 1では対象外）

## 1. 目的

起動時に Scene ファイルから初期状態を適用できるようにする。
本仕様はユーザー向けの公開機能を定義し、E2E専用機能は拡張として分離する。

## 2. スコープ

### 2.1 対象（Phase 1）

- Scene ファイルの読み込み、検証、適用
- 既存の起動状態（設定・ウィンドウ状態）への上書き適用
- エラー時のフォールバック（通常起動）とユーザー通知
- 起動後の状態を `clean`（未保存変更なし）として扱う

### 2.2 非対象（Phase 1）

- `--opacity` などの CLI オプション公開
- `waitStable` / `capture` / `__IOT_E2E__` などのE2E制御API

## 3. 用語

- `Scene`: 起動時のアプリ状態を記述したJSON
- `LaunchIntent`: 起動時に適用する内部正規化モデル

## 4. 入力経路

Phase 1 では Scene ファイル入力のみを対象にする。

- 起動時の単一ファイル入力（既存のファイル受け渡し経路）で Scene ファイルを受ける
- 具体的な拡張子判定は `.scene.json` を採用する

CLIの細かいオプションは将来Phaseで追加する。

## 5. Scene スキーマ（v1）

### 5.1 ルート

```json
{
  "version": "1.0.0",
  "window": {
    "color": "#00000000",
    "alwaysOnTop": false,
    "clickThrough": false,
    "showWindowFrame": false
  },
  "unitFactor": 1,
  "unit": "um",
  "canvas": { "x": 0, "y": 0, "scale": 1 },
  "imagePathAliases": {
    "assets": "./images",
    "shared": "D:/overlay-assets"
  },
  "images": [],
  "dimensionLines": []
}
```

### 5.2 各フィールド

- `version`（必須）: 文字列。v1は `"1.0.0"` のみ受理
- `window.color`（任意）: 既存仕様のカラー文字列
- `window.alwaysOnTop`（任意）: boolean
- `window.clickThrough`（任意）: boolean
- `window.showWindowFrame`（任意）: boolean
- `unitFactor`（任意）: number
- `unit`（任意）: `"nm" | "um" | "mm"`
- `canvas`（任意）: `{ x, y, scale }`
- `imagePathAliases`（任意）: `{ [alias: string]: string }`
  - 値は絶対パス、またはSceneファイル基準の相対パス
- `images`（必須）: array
- `images[].source`（必須）: 画像パス
  - 絶対パス
  - Sceneファイル基準の相対パス
  - `@alias/path` 形式（`imagePathAliases` を参照）
- `images[].transparency`（任意）: `0.0..1.0`
- `images[].rotation`（任意）: number
- `images[].locked` / `visible`（任意）: boolean
- `images[].filters`（任意）: 既存 ImageSet filters 構造
- `dimensionLines`（任意）: 既存 DimensionLine 構造

`images[].initAnchorPos/currentAnchorPos`、`interactionMode`、`uiHidden`、`selectedImageId` など内部依存の強い項目は公開スキーマの対象外とする。

## 6. パス解決ルール

- 許可: 絶対パス、Sceneファイルの親ディレクトリ基準の相対パス
- 許可: `@alias/path` 形式（`imagePathAliases` で定義）
- `@` で始まる場合は alias 指定として扱い、未定義aliasはエラー
- 存在しないファイルが1件でもあれば Scene 全体を不正扱い

## 7. 適用ルール

### 7.1 優先順位

1. 既存の起動状態（永続設定 + ウィンドウ状態）
2. Scene の値で上書き
3. 依存制約を適用

### 7.2 依存制約

- `clickThrough` は `alwaysOnTop=true` のときのみ有効
- `clickThrough=true` かつ `alwaysOnTop=false` の場合、`clickThrough` は無効化する（ログ警告）

### 7.3 Dirty状態

- 起動時 Scene 適用後は `clean` とする（未保存変更なし）

## 8. エラーハンドリング

以下の場合は Scene 適用を中断し、通常起動にフォールバックする。

- JSONパース失敗
- スキーマ不正
- サポート外 `version`
- パス解決失敗

ユーザーにはエラーメッセージを表示し、詳細はログに記録する。

## 9. E2E拡張との分離

E2Eは公開Scene機能の拡張として扱う。

- 通常起動: 公開Sceneスキーマのみ有効
- `--e2e` 起動: E2E拡張キーとE2E制御APIを有効

`waitStable`、`capture`、`__IOT_E2E__` はE2E時のみ許可する。

## 10. バージョニング方針

- `version` は必須
- Phase 1 では `"1.0.0"` のみ受理し、それ以外はフォールバック起動

## 11. 将来拡張（Phase 2以降）

- CLIオプションを `LaunchIntent` へマッピングするアダプタ追加
- Sceneをメニューから読み込む導線の追加
