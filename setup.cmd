@echo off
setlocal
cd /d "%~dp0"
call npm ci --ignore-scripts
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
call npm run setup
if errorlevel 1 goto failed
call npm run register
if errorlevel 1 goto failed
echo Ready. Open start.cmd to run the bot. / Hazir. Botu start.cmd ile acin.
pause
exit /b 0
:failed
echo Setup stopped. Read the message above. / Kurulum durdu. Yukaridaki mesaji okuyun.
pause
exit /b 1
