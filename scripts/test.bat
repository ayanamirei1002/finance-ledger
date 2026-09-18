@echo off
echo 🧪 运行测试...

:: 运行前端测试
echo 🎨 运行前端测试...
call pnpm test

:: 运行后端测试
echo 📦 运行后端测试...
cd src-tauri
call cargo test
cd ..

echo ✅ 测试完成！