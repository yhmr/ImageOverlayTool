# unit support

`tests/unit/support` は、複数テストで再利用する補助コードの置き場です。

- `helpers/`: テスト実行補助（例: `ipcTestHelper.ts`）
- `mocks/`: テストダブル（例: `MockIPCService.ts`）
- `mocks/repositories/`: リポジトリ系テストダブル

運用ルール:

1. 1ファイル内だけで使う補助関数は、原則その `*.spec.ts(x)` 内に置く。
2. 2ファイル以上で使う場合のみ `support` へ切り出す。
3. `support` 配下には `*.spec.ts` を置かない。
