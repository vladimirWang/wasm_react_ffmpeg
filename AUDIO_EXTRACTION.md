# MP4 音频提取功能说明

## 当前状态

当前实现是一个**框架版本**，C++ 代码中包含了音频提取的函数接口，但实际提取功能需要集成 FFmpeg 库。

## 实现方案

### 方案 1：使用 FFmpeg.wasm（推荐）

FFmpeg.wasm 是已经编译好的 FFmpeg WebAssembly 版本，可以直接在浏览器中使用。

**优点：**
- 无需编译，直接使用
- 功能完整，支持多种格式
- 社区维护，稳定可靠

**使用步骤：**
1. 安装 FFmpeg.wasm：
```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

2. 在 `AudioExtractor.jsx` 中使用 FFmpeg.wasm 替代当前的 C++ 调用

3. 示例代码：
```javascript
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

const ffmpeg = new FFmpeg()
await ffmpeg.load()

// 写入输入文件
await ffmpeg.writeFile('input.mp4', await fetchFile(file))

// 执行音频提取
await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', 'output.mp3'])

// 读取输出文件
const data = await ffmpeg.readFile('output.mp3')
```

### 方案 2：编译 FFmpeg 到 WASM

如果需要完全使用 C++ 实现，需要将 FFmpeg 编译到 WebAssembly。

**步骤：**
1. 下载 FFmpeg 源码
2. 使用 Emscripten 编译 FFmpeg
3. 在 `calculate.cpp` 中链接 FFmpeg 库
4. 实现完整的音频提取逻辑

**编译命令示例：**
```bash
emconfigure ./configure --enable-cross-compile --target-os=none \
  --arch=x86_32 --enable-gpl --enable-version3 --disable-stripping \
  --disable-ffplay --disable-ffprobe --disable-ffserver \
  --disable-doc --disable-debug --disable-asm --disable-pthreads \
  --disable-w32threads --disable-os2threads --arch=emscripten \
  --cpu=generic --disable-network --disable-hwaccels \
  --disable-parsers --disable-bsfs --disable-protocols \
  --disable-indevs --disable-outdevs --enable-protocol=file

emmake make
```

## 当前 C++ 函数接口

### `extractAudioFromMP4`
- **参数：** `fileData` (输入文件数据指针), `length` (文件大小), `outputPtr` (输出缓冲区指针，暂未使用)
- **返回：** 成功返回输出缓冲区指针，失败返回 -1（无效文件）或 -2（需要 FFmpeg）

### `getExtractedAudioSize`
- **返回：** 提取的音频数据大小（字节）

### `getExtractedAudioData`
- **返回：** 提取的音频数据指针

### `freeExtractedAudio`
- **功能：** 释放提取的音频数据内存

## 建议

对于生产环境，建议使用**方案 1（FFmpeg.wasm）**，因为：
1. 实现简单，无需复杂的编译过程
2. 功能完整，支持各种音视频格式
3. 性能良好，经过优化
4. 维护方便，社区活跃

如果需要完全使用 C++ 实现，可以使用方案 2，但需要处理 FFmpeg 的编译和链接问题。

