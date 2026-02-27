# CLI 結果規約 v1

- ステータス: Draft
- 日付: 2026-02-28
- 関連: #102

## 1. 目的

CLI の実行結果とプロセス終了コードについて、安定した機械可読の規約を定義する。

## 2. JSON 結果形式

`--format json` を指定した場合、CLI コマンドは次の形式で返す。

```json
{
  "ok": true,
  "code": "CLI_HELP",
  "message": "CLI help output.",
  "warnings": [],
  "data": {}
}
```

各フィールド:

- `ok`: 成功時は `true`、失敗時は `false`
- `code`: 安定した機械可読の結果/エラーコード
- `message`: 人間可読の要約メッセージ
- `warnings`: 警告メッセージ（なければ空配列）
- `data`: コマンド固有のペイロード

## 3. 終了コード規約

- `0`: 成功
- `2`: 引数不正 / パース失敗
- `3`: バリデーション失敗
- `4`: 実行失敗

## 4. 現在の適用範囲

- `help` コマンド:
  - `--help`（text）: 後方互換のテキスト出力
  - `--help --format json`: 上記規約で `data` に help ペイロードを格納して返す
  - JSON フォーマット指定時のパース失敗: 規約形式のエラー JSON を `stderr` に返す
- `scene-template` コマンド:
  - `--scene-template v1`（text）: Scene テンプレート JSON を直接出力
  - `--scene-template v1 --format json`: 規約形式で `data` にテンプレートを格納して返す
  - パース失敗: JSON 指定時は規約形式のエラー JSON を `stderr` に返す
- `validate-scene` コマンド:
  - `--validate-scene <path>`（text）: 成功/失敗をテキストで返す
  - `--validate-scene <path> --format json`: 規約形式で `warnings` と `data`（件数など）を返す
  - 検証失敗: 規約形式のエラー JSON を `stderr` に返し、終了コード `3`

その他のコマンド系（`startup`、`control`）への全面適用は後続 Issue で行う。
