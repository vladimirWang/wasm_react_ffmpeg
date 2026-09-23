"""
图片处理核心模块（运行于 Pyodide/Wasm 环境）
提供图片分析、预处理和智能优化功能
"""

import io
import math
from PIL import Image, ImageOps, ImageStat, UnidentifiedImageError


# ============== 工具函数 ==============

def hex_to_rgb(color: str) -> tuple:
    """'#FFFFFF' / 'FFFFFF' -> (255, 255, 255)"""
    s = (color or "").strip().lstrip("#")
    if len(s) == 3:
        s = "".join(ch * 2 for ch in s)
    if len(s) != 6:
        raise ValueError(f"非法颜色: {color}")
    return int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16)


def rgb_to_hex(rgb: tuple) -> str:
    """(255, 255, 255) -> '#FFFFFF'"""
    return "#{:02X}{:02X}{:02X}".format(int(rgb[0]), int(rgb[1]), int(rgb[2]))


def _open_image(image_bytes: bytes) -> Image.Image:
    """从字节数据打开图片并修正 EXIF 方向"""
    img = Image.open(io.BytesIO(image_bytes))
    img.load()
    img = ImageOps.exif_transpose(img)
    return img


# ============== 图片分析 ==============

def analyze_image(image_bytes: bytes) -> dict:
    """
    智能图片分析：提取主色调、清晰度、亮度、对比度等指标

    返回:
        {
            "width": int,
            "height": int,
            "format": str,
            "mode": str,
            "fileSize": int,
            "dominantColors": [{"hex": str, "ratio": float}, ...],
            "brightness": float,     # 0-255 平均亮度
            "contrast": float,       # 对比度 (标准差)
            "sharpness": float,      # 清晰度评分 0-100
            "colorfulness": float,   # 色彩丰富度 0-100
            "isDark": bool,          # 是否偏暗
            "isBlurry": bool,        # 是否模糊
            "suggestions": [str, ...]  # 优化建议
        }
    """
    img = _open_image(image_bytes)
    original_format = img.format or "UNKNOWN"
    w, h = img.size

    # 转为 RGB 模式进行分析
    rgb_img = img.convert("RGB")
    stat = ImageStat.Stat(rgb_img)

    # 平均亮度 (ITU-R BT.601)
    r_mean, g_mean, b_mean = stat.mean
    brightness = 0.299 * r_mean + 0.587 * g_mean + 0.114 * b_mean

    # 对比度（亮度通道的标准差）
    r_std, g_std, b_std = stat.stddev
    contrast = 0.299 * r_std + 0.587 * g_std + 0.114 * b_std

    # 清晰度评估（基于边缘检测的简化版：用 Laplacian 方差近似）
    # 缩小图片加速计算
    small_size = 200
    small_img = rgb_img.copy()
    small_img.thumbnail((small_size, small_size))
    sharpness = _calc_sharpness(small_img)

    # 色彩丰富度
    colorfulness = _calc_colorfulness(rgb_img)

    # 主色调提取（量化 + 聚类）
    dominant_colors = _extract_dominant_colors(small_img, top_n=5)

    # 智能建议
    suggestions = []
    if brightness < 60:
        suggestions.append("图片偏暗，建议增加亮度")
    elif brightness > 200:
        suggestions.append("图片偏亮，建议降低亮度")

    if contrast < 30:
        suggestions.append("对比度偏低，建议增强对比")

    if sharpness < 30:
        suggestions.append("图片较模糊，建议使用更清晰的原图")

    if w < 800 or h < 800:
        suggestions.append(f"分辨率较低（{w}×{h}），电商图建议至少 800×800")

    if not suggestions:
        suggestions.append("图片质量良好，可直接使用")

    return {
        "width": w,
        "height": h,
        "format": original_format,
        "mode": img.mode,
        "fileSize": len(image_bytes),
        "dominantColors": dominant_colors,
        "brightness": round(brightness, 1),
        "contrast": round(contrast, 1),
        "sharpness": round(sharpness, 1),
        "colorfulness": round(colorfulness, 1),
        "isDark": brightness < 80,
        "isBlurry": sharpness < 30,
        "suggestions": suggestions,
    }


def _calc_sharpness(img: Image.Image) -> float:
    """
    简化版清晰度评估：基于相邻像素差异
    返回 0-100 的分数
    """
    pixels = list(img.getdata())
    w, h = img.size
    if w < 2 or h < 2:
        return 100.0

    # 计算水平方向梯度
    total_diff = 0
    count = 0
    for y in range(h):
        for x in range(w - 1):
            idx = y * w + x
            p1 = pixels[idx]
            p2 = pixels[idx + 1]
            # 亮度差
            l1 = 0.299 * p1[0] + 0.587 * p1[1] + 0.114 * p1[2]
            l2 = 0.299 * p2[0] + 0.587 * p2[1] + 0.114 * p2[2]
            total_diff += abs(l1 - l2)
            count += 1

    avg_diff = total_diff / count if count > 0 else 0
    # 将平均差异映射到 0-100 分（经验公式）
    sharpness = min(100.0, avg_diff * 3.5)
    return sharpness


def _calc_colorfulness(img: Image.Image) -> float:
    """
    色彩丰富度评估
    返回 0-100 的分数
    """
    stat = ImageStat.Stat(img.convert("HSV"))
    # 饱和度均值代表色彩丰富度
    saturation_mean = stat.mean[1]
    # 乘以 100/255 归一化
    return (saturation_mean / 255.0) * 100.0


def _extract_dominant_colors(img: Image.Image, top_n: int = 5) -> list:
    """
    提取主色调：将颜色量化到 64 色空间，统计频次
    """
    pixels = list(img.getdata())
    w, h = img.size
    total = w * h

    # 量化到 4×4×4 = 64 色（每个通道 4 级）
    color_counts = {}
    for r, g, b in pixels:
        # 量化：每 64 个色阶为一级（0-3）
        qr = min(3, r // 64)
        qg = min(3, g // 64)
        qb = min(3, b // 64)
        key = (qr, qg, qb)
        color_counts[key] = color_counts.get(key, 0) + 1

    # 还原到实际颜色（取各级中点）
    def to_actual(q):
        return q * 64 + 32

    # 按频次排序
    sorted_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)

    result = []
    for (qr, qg, qb), count in sorted_colors[:top_n]:
        actual_rgb = (to_actual(qr), to_actual(qg), to_actual(qb))
        result.append({
            "hex": rgb_to_hex(actual_rgb),
            "ratio": round(count / total * 100, 1),
        })

    return result


# ============== 图片预处理 ==============

def process_image(image_bytes: bytes, options: dict) -> dict:
    """
    图片预处理（本地 Wasm 完成，无需后端）

    options:
        - maxWidth: int       最大宽度（等比缩放，只缩不放）
        - maxHeight: int      最大高度
        - square: bool        是否补边成正方形
        - background: str     补边背景色，默认 #FFFFFF
        - format: str         输出格式: JPEG / PNG / WEBP
        - quality: int        压缩质量 1-100
        - brightness: float   亮度调整 -100 到 100
        - contrast: float     对比度调整 -100 到 100
        - sharpen: bool       是否锐化

    返回:
        {
            "image": bytes (base64 字符串形式),
            "mimeType": str,
            "width": int,
            "height": int,
            "originalSize": int,
            "processedSize": int,
        }
    """
    img = _open_image(image_bytes)
    original_size = len(image_bytes)
    original_format = (img.format or "PNG").upper()

    output_format = (options.get("format") or original_format).upper()
    if output_format not in ("PNG", "JPEG", "WEBP"):
        output_format = "JPEG"

    # 1. 亮度调整
    brightness = options.get("brightness", 0)
    if brightness != 0:
        from PIL import ImageEnhance
        # -100~100 映射到 0~2，1 为原始
        factor = 1.0 + brightness / 100.0
        img = ImageEnhance.Brightness(img).enhance(factor)

    # 2. 对比度调整
    contrast = options.get("contrast", 0)
    if contrast != 0:
        from PIL import ImageEnhance
        factor = 1.0 + contrast / 100.0
        img = ImageEnhance.Contrast(img).enhance(factor)

    # 3. 锐化
    if options.get("sharpen", False):
        from PIL import ImageFilter
        img = img.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))

    # 4. 方形补边
    if options.get("square", False):
        background = options.get("background", "#FFFFFF")
        img = _pad_to_square(img, background)

    # 5. 等比缩放（只缩不放）
    max_w = options.get("maxWidth", 0) or 0
    max_h = options.get("maxHeight", 0) or 0
    if max_w > 0 or max_h > 0:
        w, h = img.size
        target_w = max_w if max_w > 0 else w
        target_h = max_h if max_h > 0 else h
        if w > target_w or h > target_h:
            img = ImageOps.contain(img, (target_w, target_h), Image.LANCZOS)

    # 6. 格式转换与编码
    # JPEG 不支持透明通道
    if output_format == "JPEG" and img.mode in ("RGBA", "P", "LA"):
        background = options.get("background", "#FFFFFF")
        img = _compose_on_background(img, hex_to_rgb(background))

    # 确保模式正确
    if output_format == "JPEG" and img.mode != "RGB":
        img = img.convert("RGB")
    elif output_format == "PNG" and img.mode not in ("RGB", "RGBA", "P", "L"):
        img = img.convert("RGBA")

    buf = io.BytesIO()
    save_kwargs = {}
    if output_format in ("JPEG", "WEBP"):
        quality = options.get("quality", 85)
        save_kwargs["quality"] = min(max(int(quality), 1), 100)

    fmt_for_save = "JPEG" if output_format == "JPEG" else output_format
    img.save(buf, format=fmt_for_save, **save_kwargs)
    processed_bytes = buf.getvalue()

    mime_map = {"PNG": "image/png", "JPEG": "image/jpeg", "WEBP": "image/webp"}

    return {
        "image": processed_bytes,
        "mimeType": mime_map.get(output_format, "image/jpeg"),
        "width": img.width,
        "height": img.height,
        "originalSize": original_size,
        "processedSize": len(processed_bytes),
    }


def _pad_to_square(img: Image.Image, background: str) -> Image.Image:
    """短边居中补边至正方形"""
    w, h = img.size
    side = max(w, h)
    if w == h:
        return img

    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)

    if has_alpha:
        canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        canvas.paste(img.convert("RGBA"), ((side - w) // 2, (side - h) // 2))
    else:
        canvas = Image.new("RGB", (side, side), hex_to_rgb(background))
        canvas.paste(img.convert("RGB"), ((side - w) // 2, (side - h) // 2))
    return canvas


def _compose_on_background(img: Image.Image, rgb: tuple) -> Image.Image:
    """把带透明通道的图合成到纯色背景上"""
    bg = Image.new("RGB", img.size, rgb)
    rgba = img.convert("RGBA")
    bg.paste(rgba, mask=rgba.split()[-1])
    return bg


# ============== 智能优化建议 ==============

def suggest_optimization(analysis: dict) -> dict:
    """
    根据分析结果给出一键优化参数建议

    返回:
        {
            "presetName": str,
            "options": { ...process_image options },
            "reason": str
        }
    """
    options = {
        "maxWidth": 800,
        "maxHeight": 800,
        "square": True,
        "background": "#FFFFFF",
        "format": "JPEG",
        "quality": 85,
        "brightness": 0,
        "contrast": 0,
        "sharpen": False,
    }

    reasons = []

    # 亮度调整建议
    if analysis["brightness"] < 80:
        options["brightness"] = 15
        reasons.append("提升亮度")
    elif analysis["brightness"] > 200:
        options["brightness"] = -10
        reasons.append("降低亮度")

    # 对比度调整
    if analysis["contrast"] < 35:
        options["contrast"] = 10
        reasons.append("增强对比度")

    # 清晰度
    if analysis["sharpness"] < 40:
        options["sharpen"] = True
        reasons.append("轻度锐化")

    # 分辨率
    if analysis["width"] > 1200 or analysis["height"] > 1200:
        options["maxWidth"] = 1000
        options["maxHeight"] = 1000
        reasons.append("缩放到 1000px")

    preset_name = "电商标准优化" if not reasons else "智能优化"
    reason_str = "、".join(reasons) if reasons else "图片质量良好，使用标准参数"

    return {
        "presetName": preset_name,
        "options": options,
        "reason": reason_str,
    }
