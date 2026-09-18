@echo off
echo 🔨 构建财务台账管理系统...

:: 清理旧的构建文件
echo 🧹 清理旧的构建文件...
if exist dist rmdir /s /q dist
if exist src-tauri\target\release\bundle rmdir /s /q src-tauri\target\release\bundle

:: 安装依赖
echo 📥 安装依赖...
call pnpm install

:: 构建前端
echo 🎨 构建前端...
call pnpm build

:: 构建 Tauri 应用
echo 📦 构建 Tauri 应用...
call pnpm tauri build

echo ✅ 构建完成！
echo 📁 构建产物位于 src-tauri\target\release\bundle\