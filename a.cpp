#include <iostream>
#include <cstdio>

// FFmpeg 头文件
extern "C" {
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
#include <libavutil/avutil.h>
}

int main() {
    std::cout << "开始测试 FFmpeg..." << std::endl;
    
    // 初始化 FFmpeg
    avformat_network_init();
    
    // 获取 FFmpeg 版本信息
    unsigned int version = avcodec_version();
    int major = (version >> 16) & 0xFF;
    int minor = (version >> 8) & 0xFF;
    int micro = version & 0xFF;
    
    std::cout << "FFmpeg 版本: " << major << "." << minor << "." << micro << std::endl;
    
    // 获取配置信息
    const char* configuration = avcodec_configuration();
    std::cout << "FFmpeg 配置: " << configuration << std::endl;
    
    // 获取许可证信息
    const char* license = avutil_license();
    std::cout << "FFmpeg 许可证: " << license << std::endl;
    
    // 测试获取编解码器
    const AVCodec* codec = avcodec_find_encoder(AV_CODEC_ID_H264);
    if (codec) {
        std::cout << "找到 H.264 编码器: " << codec->name << std::endl;
    } else {
        std::cout << "未找到 H.264 编码器" << std::endl;
    }
    
    // 测试获取音频编解码器
    const AVCodec* audio_codec = avcodec_find_encoder(AV_CODEC_ID_MP3);
    if (audio_codec) {
        std::cout << "找到 MP3 编码器: " << audio_codec->name << std::endl;
    } else {
        std::cout << "未找到 MP3 编码器" << std::endl;
    }
    
    // 测试获取格式
    const AVOutputFormat* format = av_guess_format("mp4", nullptr, nullptr);
    if (format) {
        std::cout << "找到 MP4 格式支持: " << format->name << std::endl;
    } else {
        std::cout << "未找到 MP4 格式支持" << std::endl;
    }
    
    std::cout << "FFmpeg 测试完成！" << std::endl;
    
    return 0;
}

