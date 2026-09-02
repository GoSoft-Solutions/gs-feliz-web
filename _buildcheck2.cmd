@echo off
cd /d "%~dp0"
set PNPM="C:\Users\GoSoft Team\AppData\Roaming\npm\pnpm.cmd"
set OUT=%~dp0_bc2_out.txt
echo === PORTAL BUILD === > "%OUT%"
call %PNPM% --filter @feliz/portal build >> "%OUT%" 2>&1
echo PORTAL_EXIT=%errorlevel% >> "%OUT%"
echo === ADMIN BUILD === >> "%OUT%"
call %PNPM% --filter @feliz/admin build >> "%OUT%" 2>&1
echo ADMIN_EXIT=%errorlevel% >> "%OUT%"
echo DONE >> "%OUT%"
