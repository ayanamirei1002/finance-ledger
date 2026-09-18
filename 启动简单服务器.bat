@echo off
chcp 65001 >nul
title 财务台账管理系统 - 简单服务器

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           财务台账管理系统 - 简单服务器                    ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  正在启动简单服务器...                                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: 进入项目目录
cd /d "%~dp0"

:: 检查 Node.js
echo [检查] Node.js...
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] Node.js 未安装
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)
echo [成功] Node.js 已安装
echo.

:: 启动服务器
echo [启动] 正在启动服务器...
echo.

node simple-server.js

pause