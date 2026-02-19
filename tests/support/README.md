# shared test support

`tests/support` は、unit / integration をまたいで再利用する補助コードの置き場です。

- `helpers/`: テスト実行補助（例: `ipcTestHelper.ts`）

運用ルール:

1. 1ファイル内だけで使う補助関数は、原則その `*.spec.ts(x)` / `*.int-test.ts(x)` 内に置く。
2. 2ファイル以上で再利用し、かつ unit/integration で共有する場合のみ `tests/support` へ切り出す。
3. `tests/support` 配下には `*.spec.ts(x)` / `*.int-test.ts(x)` を置かない。
