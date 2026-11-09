@echo off
setlocal
cd /d "%~dp0"

set "TIZZYQ_URL=http://127.0.0.1:8765"
set "TIZZYQ_EXE=%~dp0TizzyQ-Microclimate-Portable.exe"

echo.
echo  TizzyQ Microclimate Research Modeling Workbench
echo  Local URL: %TIZZYQ_URL%
echo  Keep this window open. Press Ctrl+C to stop the service.
echo.

start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process '%TIZZYQ_URL%'"

if exist "%TIZZYQ_EXE%" (
  "%TIZZYQ_EXE%" --host 127.0.0.1 --port 8765
) else if exist "%~dp0app.py" (
  where python >nul 2>nul
  if not errorlevel 1 (
    python app.py --host 127.0.0.1 --port 8765
  ) else (
    py -3 app.py --host 127.0.0.1 --port 8765
  )
) else (
  echo ERROR: Program files are incomplete. Copy or extract the whole folder.
  pause
  exit /b 2
)

if errorlevel 1 (
  echo.
  echo ERROR: Startup failed. Close any old TizzyQ window and try again.
  echo If the problem continues, send a screenshot of this window.
  pause
)

endlocal
