#!/bin/bash

# 测试脚本

echo "🧪 运行测试..."

# 运行前端测试
echo "🎨 运行前端测试..."
pnpm test

# 运行后端测试
echo "📦 运行后端测试..."
cd src-tauri
cargo test
cd ..

echo "✅ 测试完成！"