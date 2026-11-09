param(
    [string]$Launcher = (Join-Path $PSScriptRoot 'start.bat')
)

$ErrorActionPreference = 'Stop'

$bytes = [System.IO.File]::ReadAllBytes($Launcher)
$text = [System.Text.Encoding]::ASCII.GetString($bytes)

if ($bytes | Where-Object { $_ -gt 127 }) {
    throw 'Launcher must be ASCII-only so cmd.exe can parse it on every Windows code page.'
}

for ($index = 0; $index -lt $bytes.Length; $index++) {
    if ($bytes[$index] -eq 10 -and ($index -eq 0 -or $bytes[$index - 1] -ne 13)) {
        throw 'Launcher must use Windows CRLF line endings.'
    }
}

if ($text -notmatch 'TizzyQ-Microclimate-Portable\.exe') {
    throw 'Launcher does not target the portable executable.'
}

if ($text -notmatch 'http://127\.0\.0\.1:8765') {
    throw 'Launcher does not open the local application URL.'
}

Write-Output 'Launcher encoding and command contract OK'
