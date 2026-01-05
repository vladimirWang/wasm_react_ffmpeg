# Emscripten WASM 内存堆使用指南

## 概述

Emscripten 提供了多种类型的内存堆视图，用于在 JavaScript 和 C/C++ 之间传递数据。选择正确的堆类型对于确保数据正确传输至关重要。

## 整型数据类型选择

### HEAP32 (Int32Array) - 32位有符号整数

**使用场景：**
- C/C++ 中的 `int` 类型（通常是 32 位）
- 范围：-2,147,483,648 到 2,147,483,647
- 每个元素占用 4 字节

**示例：**
```typescript
// C++: int arr[10];
const ptr = Module._malloc(10 * 4); // 10 个 int，每个 4 字节
const heap = Module.HEAP32;
const offset = ptr / 4; // 字节指针转换为 32 位索引
for (let i = 0; i < 10; i++) {
  heap[offset + i] = arr[i]; // 写入 32 位整数
}
```

### HEAPU32 (Uint32Array) - 32位无符号整数

**使用场景：**
- C/C++ 中的 `unsigned int` 类型
- 范围：0 到 4,294,967,295
- 每个元素占用 4 字节

**示例：**
```typescript
// C++: unsigned int arr[10];
const ptr = Module._malloc(10 * 4);
const heap = Module.HEAPU32;
const offset = ptr / 4;
for (let i = 0; i < 10; i++) {
  heap[offset + i] = arr[i]; // 写入无符号 32 位整数
}
```

### HEAP16 (Int16Array) - 16位有符号整数

**使用场景：**
- C/C++ 中的 `short` 或 `int16_t` 类型
- 范围：-32,768 到 32,767
- 每个元素占用 2 字节

**示例：**
```typescript
// C++: short arr[10];
const ptr = Module._malloc(10 * 2); // 10 个 short，每个 2 字节
const heap = Module.HEAP16;
const offset = ptr / 2; // 字节指针转换为 16 位索引
for (let i = 0; i < 10; i++) {
  heap[offset + i] = arr[i];
}
```

### HEAPU16 (Uint16Array) - 16位无符号整数

**使用场景：**
- C/C++ 中的 `unsigned short` 或 `uint16_t` 类型
- 范围：0 到 65,535
- 每个元素占用 2 字节

### HEAP8 (Int8Array) - 8位有符号整数

**使用场景：**
- C/C++ 中的 `char` 或 `int8_t` 类型（有符号）
- 范围：-128 到 127
- 每个元素占用 1 字节
- **常用于字节数组、字符串、二进制数据**

**示例：**
```typescript
// C++: unsigned char* fileData;
const ptr = Module._malloc(length);
const heap = Module.HEAP8;
heap.set(fileData, ptr); // 直接使用 set 方法复制整个数组
```

### HEAPU8 (Uint8Array) - 8位无符号整数

**使用场景：**
- C/C++ 中的 `unsigned char` 或 `uint8_t` 类型
- 范围：0 到 255
- 每个元素占用 1 字节
- **最常用于处理二进制数据、文件内容、图像数据**

**示例：**
```typescript
// C++: unsigned char* buffer;
const ptr = Module._malloc(buffer.length);
const heap = Module.HEAPU8;
heap.set(buffer, ptr);
```

## 浮点数据类型选择

### HEAPF32 (Float32Array) - 32位浮点数

**使用场景：**
- C/C++ 中的 `float` 类型
- 单精度浮点数（IEEE 754）
- 每个元素占用 4 字节
- 精度：约 7 位十进制数字

**示例：**
```typescript
// C++: float arr[10];
const ptr = Module._malloc(10 * 4); // 10 个 float，每个 4 字节
const heap = Module.HEAPF32;
const offset = ptr / 4; // 字节指针转换为 32 位浮点索引
for (let i = 0; i < 10; i++) {
  heap[offset + i] = arr[i]; // 写入 32 位浮点数
}
```

### HEAPF64 (Float64Array) - 64位浮点数

**使用场景：**
- C/C++ 中的 `double` 类型
- 双精度浮点数（IEEE 754）
- 每个元素占用 8 字节
- 精度：约 15-17 位十进制数字

**示例：**
```typescript
// C++: double arr[10];
const ptr = Module._malloc(10 * 8); // 10 个 double，每个 8 字节
const heap = Module.HEAPF64;
const offset = ptr / 8; // 字节指针转换为 64 位浮点索引
for (let i = 0; i < 10; i++) {
  heap[offset + i] = arr[i]; // 写入 64 位浮点数
}
```

## 数据类型对照表

| C/C++ 类型 | JavaScript 堆类型 | 字节数 | 范围/精度 |
|-----------|-------------------|--------|----------|
| `int8_t` / `char` (有符号) | `HEAP8` (Int8Array) | 1 | -128 到 127 |
| `uint8_t` / `unsigned char` | `HEAPU8` (Uint8Array) | 1 | 0 到 255 |
| `int16_t` / `short` | `HEAP16` (Int16Array) | 2 | -32,768 到 32,767 |
| `uint16_t` / `unsigned short` | `HEAPU16` (Uint16Array) | 2 | 0 到 65,535 |
| `int32_t` / `int` | `HEAP32` (Int32Array) | 4 | -2,147,483,648 到 2,147,483,647 |
| `uint32_t` / `unsigned int` | `HEAPU32` (Uint32Array) | 4 | 0 到 4,294,967,295 |
| `int64_t` / `long long` | 需要特殊处理 | 8 | -9,223,372,036,854,775,808 到 9,223,372,036,854,775,807 |
| `uint64_t` / `unsigned long long` | 需要特殊处理 | 8 | 0 到 18,446,744,073,709,551,615 |
| `float` | `HEAPF32` (Float32Array) | 4 | 约 7 位有效数字 |
| `double` | `HEAPF64` (Float64Array) | 8 | 约 15-17 位有效数字 |

## 重要注意事项

### 1. 指针偏移计算

**关键公式：**
```typescript
// 对于 N 字节类型，偏移量 = 指针地址 / N
const offset_8bit = ptr / 1;   // HEAP8/HEAPU8
const offset_16bit = ptr / 2;  // HEAP16/HEAPU16
const offset_32bit = ptr / 4;  // HEAP32/HEAPU32/HEAPF32
const offset_64bit = ptr / 8;  // HEAPF64
```

### 2. 64位整数处理

JavaScript 的 `Number` 类型只能安全表示到 2^53-1，对于 64 位整数，Emscripten 会：
- 如果值在安全范围内，返回普通 `number`
- 如果超出范围，可能需要使用 `BigInt` 或特殊处理

### 3. 内存对齐

- 大多数情况下，Emscripten 会自动处理内存对齐
- 但建议按照数据类型大小分配内存（如 `malloc(10 * sizeof(int))`）

### 4. 有符号 vs 无符号

- **有符号**：使用 `HEAP8`, `HEAP16`, `HEAP32`
- **无符号**：使用 `HEAPU8`, `HEAPU16`, `HEAPU32`
- 选择错误会导致负数被错误解释

## 实际应用示例

### 示例 1：整数数组（当前项目中的用法）

```typescript
// C++: int sumArray(int* arr, int length);
const arr = [0, 1, 2, 3, 4, 5];
const length = arr.length;
const bytesPerInt = 4; // int 通常是 4 字节
const ptr = Module._malloc(length * bytesPerInt);
const heap = Module.HEAP32; // 使用 HEAP32 因为 C++ 中是 int
const offset = ptr / 4; // 4 字节对齐

for (let i = 0; i < length; i++) {
  heap[offset + i] = arr[i];
}
```

### 示例 2：字节数组/文件数据（当前项目中的用法）

```typescript
// C++: int64_t calculateFileSize(unsigned char* fileData, int length);
const fileData = new Uint8Array(arrayBuffer);
const ptr = Module._malloc(fileData.length);
const heap = Module.HEAPU8; // 使用 HEAPU8 因为 C++ 中是 unsigned char
heap.set(fileData, ptr); // 直接复制整个数组
```

### 示例 3：浮点数数组

```typescript
// C++: float calculateAverage(float* arr, int length);
const arr = [1.5, 2.5, 3.5, 4.5, 5.5];
const length = arr.length;
const ptr = Module._malloc(length * 4); // float 是 4 字节
const heap = Module.HEAPF32; // 使用 HEAPF32 因为 C++ 中是 float
const offset = ptr / 4;

for (let i = 0; i < length; i++) {
  heap[offset + i] = arr[i];
}
```

## 总结

- **HEAP32**：用于 32 位有符号整数（`int`），范围 -2^31 到 2^31-1
- **HEAPU32**：用于 32 位无符号整数（`unsigned int`），范围 0 到 2^32-1
- **HEAP8/HEAPU8**：用于字节数据、二进制数据、文件内容
- **HEAPF32**：用于单精度浮点数（`float`）
- **HEAPF64**：用于双精度浮点数（`double`）

选择原则：**根据 C/C++ 中的数据类型选择对应的堆类型，确保字节大小和符号性匹配。**

