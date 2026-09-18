@echo off
echo 🚀 启动财务台账管理系统开发环境...

:: 检查依赖
echo 📦 检查依赖...
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ pnpm 未安装，请先安装 pnpm
    exit /b 1
)

where cargo >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ cargo 未安装，请先安装 Rust
    exit /b 1
)

:: 安装依赖
echo 📥 安装依赖...
call pnpm install

:: 启动开发服务器
echo 🖥️ 启动开发服务器...
call pnpm tauri dev