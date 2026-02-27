Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Find-Pnpm7zaCandidates {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectRoot
    )

    $patterns = @(
        (Join-Path $ProjectRoot "node_modules\.pnpm\7zip-bin@*\node_modules\7zip-bin\win\x64\7za.exe"),
        (Join-Path $ProjectRoot "node_modules\.pnpm\7zip-bin@*\node_modules\7zip-bin\win\ia32\7za.exe")
    )

    $results = @()
    foreach ($pattern in $patterns) {
        $matches = Get-ChildItem -Path $pattern -File -ErrorAction SilentlyContinue |
            Sort-Object FullName -Descending |
            Select-Object -ExpandProperty FullName
        if ($matches) {
            $results += $matches
        }
    }

    return @($results | Select-Object -Unique)
}

function Resolve-7zaPath {
    $sevenZipA = Get-Command "7za" -ErrorAction SilentlyContinue
    if ($sevenZipA -and $sevenZipA.Path -notmatch "\\scoop\\shims\\") {
        return $null
    }
    if ($sevenZipA -and $sevenZipA.Path -match "\\scoop\\shims\\") {
        Write-Warning "Ignoring scoop shim 7za at '$($sevenZipA.Path)' and searching for a real 7za binary."
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
        $pnpmCandidates = Find-Pnpm7zaCandidates -ProjectRoot $projectRoot
        $candidatePaths = @(
            (Join-Path $projectRoot "node_modules\7zip-bin\win\x64\7za.exe"),
            (Join-Path $projectRoot "node_modules\7zip-bin\win\ia32\7za.exe"),
            $pnpmCandidates,
            (Join-Path $env:ProgramFiles "7-Zip\7za.exe"),
            (Join-Path ${env:ProgramFiles(x86)} "7-Zip\7za.exe")
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
        throw "7z.exe fallback is not supported for release packaging because it can produce broken NSIS extraction artifacts. Use a real 7za.exe."
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
