Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-7zaPath {
    $sevenZipA = Get-Command "7za" -ErrorAction SilentlyContinue
    if ($sevenZipA) {
        return $null
    }

    $projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
    $sevenZipPath = $null
    if ($env:IOT_7ZA_SOURCE_PATH) {
        if (Test-Path $env:IOT_7ZA_SOURCE_PATH) {
            $sevenZipPath = $env:IOT_7ZA_SOURCE_PATH
        } else {
            throw "IOT_7ZA_SOURCE_PATH was set but file not found: $env:IOT_7ZA_SOURCE_PATH"
        }
    }

    if (-not $sevenZipPath) {
        $candidatePaths = @(
            (Join-Path $projectRoot "node_modules\7zip-bin\win\x64\7za.exe"),
            (Join-Path $projectRoot "node_modules\7zip-bin\win\ia32\7za.exe"),
            (Join-Path $env:ProgramFiles "7-Zip\7za.exe"),
            (Join-Path ${env:ProgramFiles(x86)} "7-Zip\7za.exe"),
            (Join-Path $env:ProgramFiles "7-Zip\7z.exe"),
            (Join-Path ${env:ProgramFiles(x86)} "7-Zip\7z.exe")
        ) | Where-Object { $_ -and (Test-Path $_) }
        $candidatePaths = @($candidatePaths)

        if ($candidatePaths.Count -gt 0) {
            $sevenZipPath = $candidatePaths[0]
        }
    }

    if (-not $sevenZipPath) {
        $sevenZipA = Get-Command "7za" -ErrorAction SilentlyContinue
        if ($sevenZipA -and $sevenZipA.Path -notmatch "\\scoop\\shims\\") {
            $sevenZipPath = $sevenZipA.Path
        }
    }

    if (-not $sevenZipPath) {
        throw "7za was not found. Install 7-Zip with 7za.exe, run pnpm install to get node_modules\\7zip-bin, or set IOT_7ZA_SOURCE_PATH."
    }

    if ((Split-Path -Leaf $sevenZipPath).ToLowerInvariant() -eq "7z.exe") {
        Write-Warning "Using 7z.exe as 7za fallback. This can generate ARM64-compressed binaries that old NSIS extractors cannot restore correctly."
        Write-Warning "Prefer a real 7za.exe (node_modules\\7zip-bin\\win\\x64\\7za.exe or Program Files\\7-Zip\\7za.exe)."
    }

    $shimDir = Join-Path $env:TEMP "imageoverlaytool-local-bin"
    New-Item -ItemType Directory -Path $shimDir -Force | Out-Null
    $shimPath = Join-Path $shimDir "7za.exe"
    Copy-Item -Path $sevenZipPath -Destination $shimPath -Force
    return $shimDir
}

$shimDir = Resolve-7zaPath
if ($shimDir) {
    $env:PATH = "$shimDir;$env:PATH"
}

$env:USE_SYSTEM_7ZA = "true"

# Delegate to the canonical script to avoid drift.
pnpm run build:win
exit $LASTEXITCODE
