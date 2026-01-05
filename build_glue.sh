#!/usr/bin/env bash

# 脚本名称：build_glue.sh
# 功能：只生成 WASM 胶水代码（output.js 和 output.wasm），不生成 HTML

# 开启严格模式，遇到错误立即退出
set -euo pipefail

# 定义颜色（可选，用于美化输出）
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # 恢复默认颜色

# 第一步：检查emcc是否安装
if ! command -v emcc &> /dev/null; then
    echo -e "${RED}错误：未找到emcc命令，请先安装Emscripten环境！${NC}"
    exit 1
fi

# 第二步：检查源文件是否存在（优先使用 .cpp，如果没有则使用 .c）
if [ -f "calculate.cpp" ]; then
    SOURCE_FILE="calculate.cpp"
    echo -e "${GREEN}使用 C++ 源文件: calculate.cpp${NC}"
elif [ -f "calculate.c" ]; then
    SOURCE_FILE="calculate.c"
    echo -e "${GREEN}使用 C 源文件: calculate.c${NC}"
else
    echo -e "${RED}错误：当前目录未找到 calculate.c 或 calculate.cpp 文件！${NC}"
    exit 1
fi

# 第三步：确保 public 目录存在
mkdir -p public

# 第四步：编译生成胶水代码到 public 目录（output.js 和 output.wasm）
echo -e "${GREEN}开始编译胶水代码：emcc ${SOURCE_FILE} -o public/output.js${NC}"
echo -e "${YELLOW}编译选项：${NC}"
echo -e "  - EXPORTED_FUNCTIONS: _sumArray, _calculateFileSize, _getIntSize, _malloc, _free"
echo -e "  - EXPORTED_RUNTIME_METHODS: ccall, cwrap, HEAP32, HEAP8, HEAP16, HEAPU8, HEAPU16, HEAPU32, HEAPF32, HEAPF64"
echo -e "  - NO_EXIT_RUNTIME=1"
echo -e "  - ALLOW_MEMORY_GROWTH=1 (允许内存动态增长，支持大文件)"
echo -e "  - --no-entry"
echo ""

emcc ${SOURCE_FILE} -o public/output.js \
    -s EXPORTED_FUNCTIONS='["_sumArray","_calculateFileSize", "_getIntSize","_malloc","_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","HEAP32","HEAP8","HEAP16","HEAPU8","HEAPU16","HEAPU32","HEAPF32","HEAPF64"]' \
    -s NO_EXIT_RUNTIME=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    --no-entry

# 第五步：验证编译结果
echo ""
if [ -f "public/output.js" ]; then
    echo -e "${GREEN}✓ 编译成功！已生成 public/output.js 文件${NC}"
    # 显示文件大小
    js_size=$(du -h public/output.js | cut -f1)
    echo -e "  文件大小: ${js_size}"
else
    echo -e "${RED}✗ 编译失败：未生成 public/output.js 文件${NC}"
    exit 1
fi

if [ -f "public/output.wasm" ]; then
    echo -e "${GREEN}✓ 编译成功！已生成 public/output.wasm 文件${NC}"
    # 显示文件大小
    wasm_size=$(du -h public/output.wasm | cut -f1)
    echo -e "  文件大小: ${wasm_size}"
else
    echo -e "${RED}✗ 编译失败：未生成 public/output.wasm 文件${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}所有胶水代码文件已成功生成到 public 目录！${NC}"
echo -e "${YELLOW}提示：${NC}Vite 会自动将 public 目录中的文件作为静态资源提供服务"

