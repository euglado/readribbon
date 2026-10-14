@echo off
setlocal
cd /d "%~dp0"
if not exist dist\src\main.js goto missing
call npm start
if errorlevel 1 goto failed
exit /b 0
:missing
echo Run setup.cmd first. / Once setup.cmd dosyasini acin.
:failed
pause
exit /b 1
