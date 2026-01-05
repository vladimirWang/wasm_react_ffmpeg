#!/usr/bin/env bash

# 快速启动脚本（支持自动编译 C++ 代码）

echo "🚀 启动 WASM React 项目"
echo ""

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    echo ""
fi

# 检查 WASM 文件是否存在，如果不存在则先编译一次
if [ ! -f "public/output.js" ] || [ ! -f "public/output.wasm" ]; then
    echo "🔨 首次编译 WASM 胶水代码..."
    ./build_glue.sh
    echo ""
fi

echo "✨ 启动开发服务器（自动监听 C++ 文件变化）..."
echo "📝 编辑 calculate.cpp 或其他 .cpp/.c 文件时会自动重新编译"
echo "🌐 访问 http://localhost:3000"
echo ""
npm run dev:watch

