#!/bin/bash

# 清理脚本

echo "🧹 清理项目..."

# 清理前端构建文件
echo "🎨 清理前端构建文件..."
rm -rf dist
rm -rf node_modules

# 清理后端构建文件
echo "📦 清理后端构建文件..."
cd src-tauri
cargo clean
cd ..

# 清理日志文件
echo "📝 清理日志文件..."
rm -f *.log

echo "✅ 清理完成！"