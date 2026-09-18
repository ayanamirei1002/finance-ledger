#!/bin/bash

# 代码检查脚本

echo "🔍 运行代码检查..."

# 运行 ESLint
echo "🎨 运行 ESLint..."
pnpm lint

# 运行 Rust 检查
echo "📦 运行 Rust 检查..."
cd src-tauri
cargo clippy -- -D warnings
cargo fmt --check
cd ..

echo "✅ 代码检查完成！"