---
title: 'コマンドライン(CLI)連携ガイド'
date: 2026-02-28T00:00:00+09:00
draft: false
layout: 'page'
---

# コマンドライン(CLI)連携ガイド

**ImageOverlayTool** は強力なコマンドライン（CLI）連携機能を備えており、スクリプトや他のアプリケーションから初期状態を制御したり、起動中のアプリに外部から命令を送ったりすることができます。

---

## 1. 概要とルーティングルール

CLI機能は大きく分けて2つのサブコマンド（**`startup`** と **`control`**）にルーティングされます。

- **`startup` コマンド**: 
  - アプリの**新規起動時**に初期状態を指定するためのコマンドです。
  - まだ ImageOverlayTool が起動していない場合にのみ有効です。
- **`control` コマンド**: 
  - **すでに起動している** ImageOverlayTool のインスタンスに対して、外部から操作（画像の追加や透明度の変更など）を行うためのコマンドです。
  - アプリが起動していない場合はエラーになります。

---

## 2. 起動オプション (`startup`)

アプリ起動時に以下のオプションを指定できます。

```bash
ImageOverlayTool startup [オプション]
```

### 主なオプション

| オプション | 引数 | 説明 |
|---|---|---|
| `--scene` | `<path>` | 指定した `.scene.json` ファイルを読み込んで初期状態を適用します。このオプションは他の画像読み込みオプションと排他です。 |
| `--images` | `<path1> <path2> ...` | 1つ以上の画像ファイルを読み込みます。 |
| `--opacity` | `<0-100>` | 読み込んだ画像の初期透明度（0〜100%）を設定します。 |
| `--position` | `<x,y>` | ウィンドウの初期表示位置を指定します。 |
| `--size` | `<w,h>` | ウィンドウの初期サイズを指定します。 |
| `--always-on-top` | (なし) | 「常に手前に表示」を有効にした状態で起動します。 |
| `--click-through` | (なし) | 「クリックスルーモード」を有効にした状態で起動します（`--always-on-top` が必要です）。 |
| `--fullscreen` | (なし) | フルスクリーンモードで起動します。 |
| `--silent` | (なし) | スプラッシュスクリーンの表示をスキップします。 |
| `--minimize` | (なし) | 最小化状態で起動します。 |

---

## 3. 外部制御コマンド (`control`)

すでに起動しているアプリに対して、以下の操作を送信できます。

```bash
ImageOverlayTool control [コマンド]
```

### 利用可能なコマンド

| コマンド | 引数 | 説明 |
|---|---|---|
| `--add-image` | `<path>` | 指定した画像ファイルをキャンバスに追加します。`--opacity <0-100>` を併用して透明度を指定することも可能です。 |
| `--set-opacity` | `<0-100>` | 現在選択されている画像の透明度を変更します。 |
| `--switch-scene` | `<path.scene.json>` | 現在のプロジェクト状態を破棄し、指定したSceneファイルの状態に切り替えます。 |
| `--capture-window` | `<path.png｜path.jpg>` | 現在のアプリウィンドウ全体を指定パスに保存します。 |
| `--save-stage` | `<path.png｜path.jpg>` | 現在のステージ描画結果を指定パスに保存します。 |

---

## 4. ヘルプとその他の機能

### ヘルプの表示

各コマンドの詳しい使い方は、`--help` オプションで確認できます。

```bash
# 全体ヘルプ
ImageOverlayTool --help

# サブコマンドのヘルプ
ImageOverlayTool startup --help
ImageOverlayTool control --help
```

### JSONフォーマットでのヘルプ出力

他ツールとの連携用途に、ヘルプ情報をJSON形式で出力させる機能があります（`--format json`）。

```bash
ImageOverlayTool --help startup --format json
```

### Sceneテンプレートと検証

Sceneファイルの構造確認やバリデーションを行うための補助コマンドも用意されています。

- `--scene-template v1`: v1形式のSceneファイルのJSONテンプレートを出力します。
- `--validate-scene <path>`: 指定したSceneファイルの構造が正しいか検証します（`--format json` をつけるとJSONで結果を出力します）。

---

## 5. 使用例 (Examples)

### バッチファイルからの起動（初期設定つき）

よく使う参考画像とレイアウトをセットにして一発で起動する例です。

```bash
ImageOverlayTool startup --images "C:\assets\reference.png" --opacity 50 --always-on-top
```

### 外部ツールから画像を転送する

別の画像ビューアやエディタの「外部ツールで開く」から起動中キャンバスに画像を投げ込む例です。

```bash
ImageOverlayTool control --add-image "%1"
```

### 状態のエクスポート（自動化）

バックグラウンドで現在の状態を画像出力させる例です。

```bash
ImageOverlayTool control --capture-window "C:\out\current-state.png"
ImageOverlayTool control --save-stage "C:\out\current-stage.png"
```
