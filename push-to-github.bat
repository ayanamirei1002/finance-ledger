@echo off
chcp 65001 >nul
title Push to GitHub

set "GIT=C:\Program Files\Git\cmd\git.exe"
set "PROXY=http://127.0.0.1:7897"
cd /d "%~dp0"

echo.
echo  =============================================
echo   Push finance-ledger to GitHub
echo  =============================================
echo.

if not exist "%GIT%" (
    echo  [!] Git not found. Install Git first.
    pause
    exit /b 1
)

echo  Commit :
"%GIT%" log --oneline -1
echo.

echo  [1/3] Testing network to github.com:443 ...
node -e "const n=require('net');const s=n.connect(443,'github.com',()=>{s.destroy();process.exit(0)});s.on('error',()=>{process.exit(1)});setTimeout(()=>{process.exit(1)},5000)"
if %errorlevel% neq 0 goto :use_proxy

echo        Direct connection OK.
echo.
echo  [2/3] Pushing directly...
"%GIT%" push origin main
if %errorlevel% equ 0 goto :success
echo        Direct push failed. Switching to proxy...

:use_proxy
echo.
echo  [2/3] Direct blocked - configuring proxy for this repo...
echo        proxy    : %PROXY%
echo        TLS b/end: openssl
"%GIT%" config --local http.proxy %PROXY%
"%GIT%" config --local https.proxy %PROXY%
"%GIT%" config --local http.sslBackend openssl
echo.
echo        Pushing...
"%GIT%" push origin main
if %errorlevel% equ 0 goto :success

echo.
echo  [3/3] Retry without proxy (in case it recovered)...
"%GIT%" config --local --unset http.proxy
"%GIT%" config --local --unset https.proxy
"%GIT%" push origin main
if %errorlevel% equ 0 goto :success

echo.
echo  =============================================
echo   [X] Push failed. Please screenshot this window.
echo.
echo   Checklist:
echo     1. Is your proxy (Clash) running on port 7897?
echo     2. Can you open https://github.com in browser?
echo     3. GitHub access here is intermittent - retrying
echo        a few minutes later often works.
echo  =============================================
pause
exit /b 1

:success
echo.
echo  =============================================
echo   [OK] Push successful!
echo.
echo   Your repo:
echo     https://github.com/ayanamirei1002/finance-ledger
echo.
echo  ---------------------------------------------------------
echo   NEXT STEP: deploy to Vercel
echo.
echo     1. Open https://vercel.com and sign up with GitHub
echo     2. Click "Add New..." then "Project"
echo     3. Find "finance-ledger" and click "Import"
echo     4. Keep defaults (Vite / pnpm build / dist)
echo     5. Click "Deploy" and wait about 2 minutes
echo     6. Copy your live link, it looks like:
echo        https://finance-ledger-xxxx.vercel.app
echo  ---------------------------------------------------------
echo  =============================================
echo.
pause
