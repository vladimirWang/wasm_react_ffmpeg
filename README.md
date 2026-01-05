# WASM React 数组求和示例

这是一个使用 Vite + React + WebAssembly 的示例项目，演示如何在 React 中调用 C 语言编译的 WASM 函数。

## 项目结构

```
wasm_react2/
├── calculate.c          # C 源文件（数组求和函数）
├── build_glue.sh       # 编译脚本（生成 WASM 胶水代码）
├── public/              # 静态资源目录
│   ├── output.js        # Emscripten 生成的胶水代码
│   └── output.wasm      # WebAssembly 二进制文件
├── src/                 # React 源代码
│   ├── App.jsx          # 主组件（包含按钮和调用逻辑）
│   ├── App.css          # 组件样式
│   ├── main.jsx         # 入口文件
│   └── index.css        # 全局样式
├── package.json         # 项目依赖
└── vite.config.js       # Vite 配置
```

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 编译 WASM 胶水代码

确保已安装 Emscripten SDK，然后运行：

```bash
./build_glue.sh
```

这会生成 `public/output.js` 和 `public/output.wasm` 文件。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 功能说明

- **WASM 模块加载**：页面加载时自动加载 WASM 模块
- **数组求和**：点击按钮调用 C 函数 `sumArray`，计算数组 [0, 1, 2, 3, 4, 5] 的和
- **结果显示**：计算结果显示在页面上（结果为 15）

## 技术要点

1. **WASM 集成**：通过动态加载 `output.js` 脚本，配置 `Module` 对象
2. **内存管理**：使用 `_malloc` 分配内存，`_free` 释放内存
3. **数据传递**：通过 `HEAP32` 将 JavaScript 数组复制到 WASM 内存
4. **函数调用**：使用 `ccall` 调用 C 函数

## 构建生产版本

```bash
npm run build
```

生成的文件在 `dist` 目录中。

