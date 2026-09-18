@echo off
chcp 65001 >nul
title 财务台账管理系统 - Web 版本

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           财务台账管理系统 - Web 版本                      ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  正在启动 Web 版本...                                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: 进入项目目录
cd /d "%~dp0"

:: 设置环境变量
set CI=true
set PNPM_CONFIRM_MODULES_PURGE=false

:: 检查依赖是否已安装
if not exist "node_modules" (
    echo [信息] 首次运行，正在安装依赖...
    echo 这可能需要几分钟时间，请耐心等待...
    echo.
    call pnpm install --no-frozen-lockfile
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 依赖安装失败
        echo 请检查网络连接或以管理员身份运行
        pause
        exit /b 1
    )
)

echo.
echo [启动] 正在启动开发服务器...
echo.

echo ╔════════════════════════════════════════════════════════════╗
echo ║                    启动成功！                              ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  请在浏览器中访问: http://localhost:3000                   ║
echo ║                                                           ║
echo ║  按 Ctrl+C 可以停止服务器                                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: 启动开发服务器（跳过 TypeScript 检查）
call pnpm dev:web

pause