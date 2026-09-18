#!/bin/bash

# 开发环境启动脚本

echo "🚀 启动财务台账管理系统开发环境..."

# 检查依赖
echo "📦 检查依赖..."
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安装，请先安装 pnpm"
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    echo "❌ cargo 未安装，请先安装 Rust"
    exit 1
fi

# 安装依赖
echo "📥 安装依赖..."
pnpm install

# 启动开发服务器
echo "🖥️ 启动开发服务器..."
pnpm tauri dev