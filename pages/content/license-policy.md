---
title: 'ライセンス方針'
date: 2026-02-13T00:00:00+09:00
draft: false
layout: 'page'
---

# ライセンス方針

## プロジェクトライセンス

ImageOverlayTool は次のライセンスで配布されます。

- `AGPL-3.0-only`

全文は `LICENSE` を参照してください。

## 再配布時の注意

本ソフトウェア（改変版を含む）を再配布する場合は、ソースコード提供義務を含む AGPL の要件を満たす必要があります。

## 商用/ストア配布に関する注意

AGPL でも商用配布自体は可能です。  
ただし、配布形態や提供モデルが AGPL の要件に適合していることを確認してください。  
法的要件に不明点がある場合は、公開前に法務確認を行ってください。

## サードパーティライセンス

本プロジェクトは第三者 OSS 依存を含みます。  
依存ライセンス一覧はビルド/パッケージ時に `licenses.json` として生成します。

## 追加の特許・商標許諾について

適用法令や各ライセンスで要求される範囲を除き、追加の特許権・商標権の許諾は行いません。

## Microsoft Store 用ライセンス文（貼り付けテンプレート）

以下を実行して最終文面を生成してください。

```bash
npm run generate-store-license-terms
```

生成された `STORE_LICENSE_TERMS.txt` を Partner Center の `Applicable license terms` に貼り付けます。

```text
ImageOverlayTool is licensed under the GNU Affero General Public License v3.0 only (AGPL-3.0-only).

Copyright (c) yhmr.

Corresponding Source Code:
https://github.com/yhmr/ImageOverlayTool
https://github.com/yhmr/ImageOverlayTool/tree/<release-tag-or-commit>

A copy of the AGPL-3.0 license text is included with this app package.
```
