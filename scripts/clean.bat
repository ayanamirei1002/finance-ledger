@echo off
echo 🧹 清理项目...

:: 清理前端构建文件
echo 🎨 清理前端构建文件...
if exist dist rmdir /s /q dist
if exist node_modules rmdir /s /q node_modules

:: 清理后端构建文件
echo 📦 清理后端构建文件...
cd src-tauri
call cargo clean
cd ..

:: 清理日志文件
echo 📝 清理日志文件...
if exist *.log del *.log

echo ✅ 清理完成！