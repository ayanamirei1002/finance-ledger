@echo off
echo ========================================
echo   Rust 安装脚本
echo ========================================
echo.

echo [1/3] 下载 Rust 安装程序...
echo 请访问 https://rustup.rs/ 下载并运行 rustup-init.exe
echo.
echo 或者使用以下命令直接下载：
echo curl -o rustup-init.exe https://win.rustup.rs/x86_64
echo.

echo [2/3] 安装说明：
echo 1. 运行 rustup-init.exe
echo 2. 选择选项 1 (Proceed with standard installation)
echo 3. 按回车确认
echo 4. 等待安装完成
echo.

echo [3/3] 安装完成后，请：
echo 1. 重启此终端
echo 2. 运行 rustc --version 验证安装
echo 3. 运行 cargo --version 验证安装
echo.

echo ========================================
echo 安装完成后，请运行以下命令：
echo.
echo cd 财务软件开发
echo pnpm install
echo pnpm tauri dev
echo ========================================
echo.

pause