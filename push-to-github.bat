@echo off
chcp 65001 >nul
title Push to GitHub

set "GIT=C:\Program Files\Git\cmd\git.exe"
cd /d "%~dp0"

echo.
echo  =============================================
echo   Push finance-ledger to GitHub
echo  =============================================
echo.

if not exist "%GIT%" (
    echo  [!] Git not found at %GIT%
    echo      Please install Git first.
    pause
    exit /b 1
)

echo  [1/4] Git version:
"%GIT%" --version
echo.

echo  [2/4] Local commit:
"%GIT%" log --oneline -1
echo.

echo  [3/4] Pushing to GitHub...
echo.
echo  ---------------------------------------------------------
echo   A browser window will open asking you to sign in to
echo   GitHub. This is Git Credential Manager - it is safe.
echo   Just click "Sign in with your browser" and authorize.
echo  ---------------------------------------------------------
echo.
pause

"%GIT%" push -u origin main
if %errorlevel% equ 0 goto :success

echo.
echo  [!] Normal push was rejected.
echo      This usually means the remote repo already has a
echo      commit (for example an auto-created README).
echo.
echo  [4/4] Trying force push (overwrites remote README)...
echo.
"%GIT%" push -u origin main --force

if %errorlevel% equ 0 goto :success

echo.
echo  =============================================
echo   [X] Push failed. Check the error above.
echo.
echo   Common causes:
echo     - Not signed in to GitHub (retry, allow browser)
echo     - Wrong repo URL
echo     - Network / proxy issue
echo  =============================================
pause
exit /b 1

:success
echo.
echo  =============================================
echo   [OK] Push successful!
echo.
echo   Next: deploy to Vercel
echo     1. Go to https://vercel.com
echo     2. Sign in with GitHub
echo     3. Add New  ->  Project  ->  finance-ledger  ->  Import
echo     4. Framework Preset : Vite
echo        Build Command    : pnpm build
echo        Output Directory : dist
echo     5. Click Deploy, wait about 2 minutes
echo     6. Get your link and put it on your resume
echo  =============================================
echo.
pause
