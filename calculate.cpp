#include <cstdio>
#include <cstdlib>
#include <emscripten.h>

#ifdef __cplusplus
extern "C" {
#endif

// 数组求和函数，使用 EMSCRIPTEN_KEEPALIVE 导出给 JavaScript 调用
EMSCRIPTEN_KEEPALIVE
int sumArray(int* arr, int length) {
    int sum = 0;
    for (int i = 0; i < length; i++) {
        sum += arr[i];
    }
    return sum;
}

// 计算文件大小函数，接收文件数据的指针和长度，返回文件大小（字节数）
// 使用 int64_t 确保在 JavaScript 中正确转换为 number
EMSCRIPTEN_KEEPALIVE
int64_t calculateFileSize(unsigned char* fileData, int length) {
    // 验证输入
    if (fileData == NULL || length < 0) {
        return -1; // 错误：无效输入
    }
    
    // 返回文件大小（字节数）
    // 可以在这里添加文件验证逻辑，例如检查 MP4 文件头等
    return static_cast<int64_t>(length);
}

EMSCRIPTEN_KEEPALIVE
size_t getIntSize() {
    return sizeof(int); // 返回当前编译环境下 int 的字节数
}


#ifdef __cplusplus
}
#endif

int main() {
    // main 函数保留，但不会自动执行（通过 noInitialRun 选项）
    return 0;
}

