---
title: 'License Policy'
date: 2026-02-13T00:00:00+09:00
draft: false
layout: 'page'
---

# License Policy

## Project License

ImageOverlayTool is distributed under:

- `AGPL-3.0-only`

See the full text in `LICENSE`.

## What This Means for Redistribution

If you distribute this software (including modified versions), you must follow AGPL obligations, including source code availability requirements.

## Commercial / Store Distribution Note

AGPL can be used for commercial distribution, but distribution method and obligations must remain compliant.  
If your store/business model has legal constraints, review AGPL requirements with legal counsel before release.

## Third-Party Licenses

This project includes third-party OSS dependencies.  
Their license notices are generated into `licenses.json` during build/package steps.

## No Additional Patent or Trademark Grants

Except where required by applicable licenses, no additional patent or trademark rights are granted by this project.

## Microsoft Store - Applicable license terms (template)

Generate the final text with:

```bash
pnpm run generate-store-submission-files
```

This generates two files for different purposes:

- `STORE_LICENSE_TERMS.txt`: paste into Partner Center (`Applicable license terms`)
- `SOURCE_CODE_URL.txt`: source-code notice text bundled with the distributed package

```text
ImageOverlayTool is licensed under the GNU Affero General Public License v3.0 only (AGPL-3.0-only).

Copyright (c) yhmr.

Corresponding Source Code:
https://github.com/yhmr/ImageOverlayTool
https://github.com/yhmr/ImageOverlayTool/tree/<release-tag-or-commit>

A copy of the AGPL-3.0 license text is included with this app package.
```
