# Changelog

## [1.3.1](https://github.com/yhmr/ImageOverlayTool/compare/imageoverlaytool-v1.3.0...imageoverlaytool-v1.3.1) (2026-11-25)


### Features

* **e2e:** add deterministic control plane for scene capture ([03b4546](https://github.com/yhmr/ImageOverlayTool/commit/03b45468de54e7f805c204fa9635a1c58fe7931a))
* MUI→shadcn/ui移行 & React Compiler導入 ([ef53ad2](https://github.com/yhmr/ImageOverlayTool/commit/ef53ad2935fe84882165d013a9da7ca05a9757a7))
* **release:** enforce release prep and project version guard ([2e0e62c](https://github.com/yhmr/ImageOverlayTool/commit/2e0e62cc907d3444ca9b11ae31cc6e6eeba7e5ea))
* **release:** implement phase 1-4 release readiness ([#58](https://github.com/yhmr/ImageOverlayTool/issues/58) [#59](https://github.com/yhmr/ImageOverlayTool/issues/59) [#60](https://github.com/yhmr/ImageOverlayTool/issues/60) [#61](https://github.com/yhmr/ImageOverlayTool/issues/61)) ([3ace4d5](https://github.com/yhmr/ImageOverlayTool/commit/3ace4d5d80af8d91d0050c0e26ed692b5a4c05b1))
* **release:** implement phase 1-4 release readiness ([#58](https://github.com/yhmr/ImageOverlayTool/issues/58) [#59](https://github.com/yhmr/ImageOverlayTool/issues/59) [#60](https://github.com/yhmr/ImageOverlayTool/issues/60) [#61](https://github.com/yhmr/ImageOverlayTool/issues/61)) ([ed7dccf](https://github.com/yhmr/ImageOverlayTool/commit/ed7dccf066f441d0bb151bd7409d8128bc00896f))
* TypeScript 5.7 および React 19 へバージョン更新 ([#25](https://github.com/yhmr/ImageOverlayTool/issues/25)) ([7892a9a](https://github.com/yhmr/ImageOverlayTool/commit/7892a9ad2492577f20ca63b4ce803edaaaa8da2a))
* TypeScript 5.x および React 19 へのバージョン更新 ([5e7f1bd](https://github.com/yhmr/ImageOverlayTool/commit/5e7f1bdbb95725ac214fe5efc47189adfffad4f7))


### Bug Fixes

* App.tsxのnullチェックをthrow形式に変更 ([182fb5b](https://github.com/yhmr/ImageOverlayTool/commit/182fb5b60977cbbf49cb9be2c94cb5bbd05bd604))
* **e2e:** CI環境で2回までリトライするよう設定 ([16f5e9e](https://github.com/yhmr/ImageOverlayTool/commit/16f5e9edc57142bffdb6cf7e8d330af010542390))
* **e2e:** E2Eテストのタイムアウトを60秒に延長 ([a70a66d](https://github.com/yhmr/ImageOverlayTool/commit/a70a66d1cf6ad77a647984e3768d0bae3e00365a))
* **e2e:** Playwrightテスト全体のタイムアウトを90秒に延長 ([00d3425](https://github.com/yhmr/ImageOverlayTool/commit/00d3425fe916fff9ba91dec85edf4a3741a0b589))
* **renderer:** prevent undo history entry during project load ([878806d](https://github.com/yhmr/ImageOverlayTool/commit/878806d2effca70404d036710b0a01181cc2d21b))
* share electron-store instance between repositories ([e1c941e](https://github.com/yhmr/ImageOverlayTool/commit/e1c941e46e29dfd34117ce93ee850c7b37d1fddc))
* 新規プロジェクト作成時にwindowColorを保持するよう修正 ([563efc2](https://github.com/yhmr/ImageOverlayTool/commit/563efc2eb2e574b675b8287d2951f463bcc95e2f))


### Performance Improvements

* cleanupClipboardCacheの期限切れファイル削除をPromise.allSettledで並列化 ([4913ffd](https://github.com/yhmr/ImageOverlayTool/commit/4913ffd520bfbb08433237a0555c1b5bf2f6d5bd))


### Continuous Integration

* add release-please workflow and configuration ([82ad9ad](https://github.com/yhmr/ImageOverlayTool/commit/82ad9adffed3a08b33d36cddd9292400ebff0301))
