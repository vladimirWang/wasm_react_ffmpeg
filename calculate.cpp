#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <emscripten.h>

// FFmpeg 头文件（条件编译）
#ifdef USE_FFMPEG
extern "C" {
#include <libavformat/avformat.h>
#include <libavutil/avutil.h>
#include <libavutil/mem.h>
}
#endif

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

#ifdef USE_FFMPEG
// 自定义 AVIOContext 读取函数，从内存缓冲区读取数据
struct BufferData {
    unsigned char* data;
    int size;
    int pos;
};

static int read_packet(void* opaque, uint8_t* buf, int buf_size) {
    BufferData* bd = (BufferData*)opaque;
    int remaining = bd->size - bd->pos;
    if (remaining <= 0) {
        return AVERROR_EOF;
    }
    int to_read = (buf_size < remaining) ? buf_size : remaining;
    memcpy(buf, bd->data + bd->pos, to_read);
    bd->pos += to_read;
    return to_read;
}

static int64_t seek_packet(void* opaque, int64_t offset, int whence) {
    BufferData* bd = (BufferData*)opaque;
    int64_t new_pos;
    
    if (whence == AVSEEK_SIZE) {
        return bd->size;
    }
    
    switch (whence) {
        case SEEK_SET:
            new_pos = offset;
            break;
        case SEEK_CUR:
            new_pos = bd->pos + offset;
            break;
        case SEEK_END:
            new_pos = bd->size + offset;
            break;
        default:
            return -1;
    }
    
    if (new_pos < 0 || new_pos > bd->size) {
        return -1;
    }
    
    bd->pos = (int)new_pos;
    return new_pos;
}
#endif

// 查找 MP4 文件中音频流的 stream_index
// 如果编译时启用了 FFmpeg，使用 FFmpeg API
// 否则使用文件格式解析方法
// 返回：stream_index (>= 0) 表示找到音频流，-1 表示未找到，-2 表示错误
EMSCRIPTEN_KEEPALIVE
int findAudioStreamIndex(unsigned char* fileData, int length) {
    // 验证输入
    if (fileData == NULL || length < 8) {
        return -2; // 错误：无效输入
    }
    
#ifdef USE_FFMPEG
    // 使用 FFmpeg 实现
    AVFormatContext* fmt_ctx = NULL;
    AVIOContext* avio_ctx = NULL;
    unsigned char* avio_ctx_buffer = NULL;
    int avio_ctx_buffer_size = 4096;
    BufferData bd = {0};
    int ret = -2;
    
    // 初始化缓冲区数据
    bd.data = fileData;
    bd.size = length;
    bd.pos = 0;
    
    // 分配 AVIOContext 缓冲区
    avio_ctx_buffer = (unsigned char*)av_malloc(avio_ctx_buffer_size);
    if (!avio_ctx_buffer) {
        return -2; // 内存分配失败
    }
    
    // 创建 AVIOContext
    avio_ctx = avio_alloc_context(
        avio_ctx_buffer, 
        avio_ctx_buffer_size,
        0, // write_flag
        &bd, // opaque
        read_packet, 
        NULL, // write_packet
        seek_packet
    );
    
    if (!avio_ctx) {
        av_freep(&avio_ctx_buffer);
        return -2; // AVIOContext 创建失败
    }
    
    // 分配 AVFormatContext
    fmt_ctx = avformat_alloc_context();
    if (!fmt_ctx) {
        avio_context_free(&avio_ctx);
        av_freep(&avio_ctx_buffer);
        return -2; // AVFormatContext 分配失败
    }
    
    // 设置自定义 IO
    fmt_ctx->pb = avio_ctx;
    
    // 打开输入文件（从内存）
    int err = avformat_open_input(&fmt_ctx, NULL, NULL, NULL);
    if (err < 0) {
        // 如果 fmt_ctx 被分配了，需要释放
        if (fmt_ctx) {
            avformat_free_context(fmt_ctx);
        }
        avio_context_free(&avio_ctx);
        av_freep(&avio_ctx_buffer);
        return -2; // 打开输入失败
    }
    
    // 读取流信息
    if (avformat_find_stream_info(fmt_ctx, NULL) < 0) {
        avformat_close_input(&fmt_ctx);
        avio_context_free(&avio_ctx);
        av_freep(&avio_ctx_buffer);
        return -2; // 读取流信息失败
    }
    
    // 遍历所有流，查找音频流
    int stream_index = -1;
    for (unsigned int i = 0; i < fmt_ctx->nb_streams; i++) {
        AVStream* stream = fmt_ctx->streams[i];
        if (stream->codecpar->codec_type == AVMEDIA_TYPE_AUDIO) {
            // 找到音频流，返回 stream_index
            stream_index = (int)i;
            break;
        }
    }
    
    // 清理资源
    avformat_close_input(&fmt_ctx);
    avio_context_free(&avio_ctx);
    av_freep(&avio_ctx_buffer);
    
    return stream_index >= 0 ? stream_index : -1;
#else
    // 回退实现：通过解析 MP4 文件格式查找音频流
    // 遍历所有 trak box，查找第一个音频流并返回其索引
    int stream_index = 0; // 当前流的索引
    
    for (int i = 0; i <= length - 8; i++) {
        // 读取 4 字节的大小（大端序）
        unsigned int boxSize = (fileData[i] << 24) | 
                               (fileData[i + 1] << 16) | 
                               (fileData[i + 2] << 8) | 
                               fileData[i + 3];
        
        // 读取 4 字节的类型
        if (i + 4 <= length - 4) {
            // 检查是否是 'trak' box
            if (fileData[i + 4] == 't' && 
                fileData[i + 5] == 'r' && 
                fileData[i + 6] == 'a' && 
                fileData[i + 7] == 'k') {
                
                int trakStart = i;
                int trakEnd = (boxSize == 1) ? length : (trakStart + (int)boxSize);
                if (trakEnd > length) trakEnd = length;
                
                // 在 trak box 内搜索 'hdlr' box 检查是否为音频流
                bool is_audio = false;
                for (int j = trakStart + 8; j <= trakEnd - 8; j++) {
                    unsigned int innerBoxSize = (fileData[j] << 24) | 
                                                 (fileData[j + 1] << 16) | 
                                                 (fileData[j + 2] << 8) | 
                                                 fileData[j + 3];
                    
                    if (j + 4 <= length - 4) {
                        // 检查是否是 'hdlr' box (Handler Reference Box)
                        if (fileData[j + 4] == 'h' && 
                            fileData[j + 5] == 'd' && 
                            fileData[j + 6] == 'l' && 
                            fileData[j + 7] == 'r') {
                            
                            int handlerTypeOffset = j + 8;
                            
                            if (handlerTypeOffset < length) {
                                // 检查版本（第一个字节）
                                int version = fileData[handlerTypeOffset];
                                int handlerTypePos = handlerTypeOffset + 4; // 跳过 version + flags
                                
                                if (version == 0) {
                                    handlerTypePos += 4; // 跳过 pre_defined
                                } else {
                                    handlerTypePos += 8; // 跳过 pre_defined (64-bit)
                                }
                                
                                if (handlerTypePos + 4 <= length) {
                                    // 检查 handler type 是否为 'soun' (音频)
                                    if (fileData[handlerTypePos] == 's' && 
                                        fileData[handlerTypePos + 1] == 'o' && 
                                        fileData[handlerTypePos + 2] == 'u' && 
                                        fileData[handlerTypePos + 3] == 'n') {
                                        // 找到音频流，返回当前的 stream_index
                                        is_audio = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                
                // 如果找到音频流，返回 stream_index
                if (is_audio) {
                    return stream_index;
                }
                
                // 增加流索引（每个 trak 对应一个流）
                stream_index++;
            }
        }
    }
    
    return -1; // 未找到音频流
#endif
}


#ifdef __cplusplus
}
#endif

int main() {
    // main 函数保留，但不会自动执行（通过 noInitialRun 选项）
    return 0;
}

