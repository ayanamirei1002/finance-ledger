@echo off
echo 🔍 运行代码检查...

:: 运行 ESLint
echo 🎨 运行 ESLint...
call pnpm lint

:: 运行 Rust 检查
echo 📦 运行 Rust 检查...
cd src-tauri
call cargo clippy -- -D warnings
call cargo fmt --check
cd ..

echo ✅ 代码检查完成！