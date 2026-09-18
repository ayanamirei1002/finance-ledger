@echo off
chcp 65001 >nul
title 财务台账管理系统 - OCR 服务

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   财务台账管理系统 - 本地 OCR 服务                         ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  引擎: Windows 内置 OCR（离线，无需 API Key）             ║
echo ║  端口: 127.0.0.1:3100                                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] Node.js 未安装
    pause
    exit /b 1
)

node ocr-server.js 3100
pause
