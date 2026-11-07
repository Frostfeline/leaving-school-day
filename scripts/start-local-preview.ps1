$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$previewUrl = 'http://127.0.0.1:5173/'

function Test-Preview {
    try {
        $response = Invoke-WebRequest -Uri $previewUrl -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200 -and $response.Content.Contains('/@vite/client')
    } catch { return $false }
}

try {
    if (-not (Test-Preview)) {
        $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
        $nodePath = if ($nodeCommand) { $nodeCommand.Source } else {
            Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
        }
        if (-not (Test-Path -LiteralPath $nodePath)) {
            throw 'Node.js was not found. Install Node.js 22.18 or newer, then try again.'
        }
        if (-not (Test-Path -LiteralPath 'node_modules/vite/bin/vite.js')) {
            throw 'Project dependencies are missing. Run npm install in the project folder first.'
        }
        Write-Host 'Keep this window open while playing. You may minimize it.' -ForegroundColor Yellow
        Write-Host "Game address: $previewUrl"
        Write-Host 'Press Ctrl+C or close this window to stop the local server.'
        & $nodePath 'node_modules/vite/bin/vite.js' '--configLoader' 'native' `
            '--host' '127.0.0.1' '--port' '5173' '--strictPort' '--open'
        if ($LASTEXITCODE -ne 0) { throw "Preview stopped with exit code $LASTEXITCODE. See the error above." }
        exit 0
    }
    Start-Process $previewUrl
    Write-Host "Game preview is ready: $previewUrl"
    Write-Host 'An existing preview server is running. Keep its original window open.'
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
