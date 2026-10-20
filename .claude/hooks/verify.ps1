# PostToolUse hook (Edit|Write): after a TypeScript file in the app changes, run the typecheck, lint and tests.
# Exit 2 + stderr hands the errors back to Claude; anything else stays quiet.

[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

try {
  $payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
} catch {
  exit 0
}

$file = $payload.tool_input.file_path
if (-not $file) { $file = $payload.tool_response.filePath }
if (-not $file -or $file -notmatch '\.(ts|tsx)$') { exit 0 }
# Deno Edge Functions and the old code are excluded from tsc and lint.
if ($file -match '[\\/](supabase[\\/]functions|legacy-backup|node_modules)[\\/]') { exit 0 }

$root = $env:CLAUDE_PROJECT_DIR
if (-not $root) { $root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot) }
Set-Location -LiteralPath $root

# Single instance: edits arrive faster than a full run finishes, and overlapping runs (each with tsc,
# ESLint and Jest workers) exhausted memory. While a run is in progress, later edits skip; the next edit
# after it finishes checks the latest state. A lock older than 15 minutes or held by a dead process is stale.
$lockPath = Join-Path $PSScriptRoot '.verify.lock'
if (Test-Path -LiteralPath $lockPath) {
  $lock = Get-Item -LiteralPath $lockPath
  $holder = (Get-Content -LiteralPath $lockPath -ErrorAction SilentlyContinue | Select-Object -First 1) -as [int]
  $alive = $holder -and (Get-Process -Id $holder -ErrorAction SilentlyContinue)
  if ($alive -and $lock.LastWriteTime -gt (Get-Date).AddMinutes(-15)) { exit 0 }
  Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
}
try {
  $stream = [System.IO.File]::Open($lockPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write)
  $writer = New-Object System.IO.StreamWriter($stream)
  $writer.Write($PID)
  $writer.Close()
} catch {
  exit 0 # another run created the lock first
}

try {
  # App code (no Node/Jest globals), then tests.
  $tsc = (& npx tsc --noEmit 2>&1 | Out-String)
  if ($LASTEXITCODE -eq 0) { $tsc = (& npx tsc --noEmit -p tsconfig.test.json 2>&1 | Out-String) }
  $tscFailed = $LASTEXITCODE -ne 0
  # --no-cache: this runs in the background between edits; a cached result for a half-edited file would go
  # stale in .expo/cache/eslint and keep failing later `expo lint` runs.
  $lint = (& npx expo lint --no-cache 2>&1 | Out-String)
  $lintFailed = $LASTEXITCODE -ne 0

  # Two workers keep memory bounded while the dev server is also running.
  $tests = (& npx jest --silent --maxWorkers=2 2>&1 | Out-String)
  $testsFailed = $LASTEXITCODE -ne 0
} finally {
  Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
}

if ($tscFailed -or $lintFailed -or $testsFailed) {
  $report = @()
  if ($tscFailed) { $report += "tsc --noEmit failed:`n$tsc" }
  if ($lintFailed) { $report += "expo lint failed:`n$lint" }
  if ($testsFailed) { $report += "jest failed:`n$tests" }
  [Console]::Error.WriteLine(($report -join "`n"))
  exit 2
}
exit 0
