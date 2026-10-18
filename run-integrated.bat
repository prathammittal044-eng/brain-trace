@echo off
setlocal
PowerShell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-integrated.ps1"
if errorlevel 1 (
    echo.
    echo BrainTrace failed to start. Review the error above.
    pause
    exit /b 1
)
echo.
echo BrainTrace launch commands were started in separate PowerShell windows.
pause
