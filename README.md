# ImageOverlayTool

Electron + React で作られた画像オーバーレイ/ブレンド用のデスクトップアプリです。複数画像を読み込み、Konva 上で重ね合わせながら位置調整・変形・透過度調整を行います。設定はローカルに保存されます。

## 特徴
- 複数画像の読み込みとレイヤー順のドラッグ&ドロップ並び替え。
- 選択中画像のドラッグ移動・四隅アンカーによる変形。
- マウスホイールによるステージの拡大/縮小。
- 画像の透過度スライダー調整。
- 右クリックのコンテキストメニューから背景色（ウィンドウカラー）を変更。
- 言語切り替えと単位係数（`unit_factor`）の保存。

## 技術スタック
- Electron（メインプロセス/IPC）
- React + Redux Toolkit
- Konva / react-konva（キャンバス描画）
- Material UI
- i18next

## セットアップ
> 前提: Node.js とパッケージマネージャ（npm 等）が必要です。バージョン指定はリポジトリ内に明記されていないため、利用する環境に合わせて用意してください。

```bash
npm install
```

## 開発・ビルドコマンド
```bash
# 開発（TSの監視 + webpack + Electron 起動）
npm run dev

# 本番ビルド
npm run build

# main/preload の TypeScript コンパイル + webpack（開発用）
npm run compile

# パッケージング
npm run package

# eslint/prettier を実行
npm run lint-fix
```

## 使い方（操作の概要）
1. メニューから画像設定ダイアログを開き、画像を追加します。
2. 画像を選択すると、キャンバス上でドラッグ移動や四隅アンカーのドラッグによる変形が可能です。
3. 右下のスライダーで透過度を調整します。
4. 右クリックメニューから背景色を変更できます。

## 設定の保存
以下はアプリのユーザーデータ領域に保存されます。
- ウィンドウの位置・サイズ・背景色
- 言語設定
- 単位係数（`unit_factor`）

## ディレクトリ構成
- `src/main.ts`: Electron メインプロセス、ウィンドウ/IPC の定義
- `src/preload.ts`: Renderer から利用する IPC API の橋渡し
- `src/web/`: Renderer（React）側の UI 実装