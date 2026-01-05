import { useState, ChangeEvent } from 'react'
import type { EmscriptenModule } from '../types/wasm'
import './VideoStreamDetector.css'

interface VideoStreamDetectorProps {
  wasmReady: boolean
  Module?: EmscriptenModule
}

function VideoStreamDetector({ wasmReady, Module }: VideoStreamDetectorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [streamIndex, setStreamIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    
    if (!selectedFile) {
      setFile(null)
      setStreamIndex(null)
      setError(null)
      return
    }

    // 检查文件类型
    if (selectedFile.type !== 'video/mp4' && !selectedFile.name.toLowerCase().endsWith('.mp4')) {
      setError('请选择 MP4 格式的视频文件')
      setFile(null)
      setStreamIndex(null)
      return
    }

    setError(null)
    setFile(selectedFile)
    setStreamIndex(null)
  }

  const handleCheckAudioStream = async () => {
    if (!file) {
      setError('请先选择文件')
      return
    }

    setLoading(true)
    setError(null)
    setStreamIndex(null)

    try {
      // 检查 WASM 模块是否就绪
      if (!wasmReady || !Module || !Module.ccall || !Module.HEAP8) {
        setError('WASM 模块未就绪')
        setLoading(false)
        return
      }

      // 读取文件为 ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const fileData = new Uint8Array(arrayBuffer)
      const length = fileData.length

      // 分配 WASM 内存
      const ptr = Module._malloc(length)

      if (!ptr) {
        setError('内存分配失败')
        setLoading(false)
        return
      }

      try {
        // 将文件数据复制到 WASM 内存
        const heap = Module.HEAP8
        heap.set(fileData, ptr)

        // 调用 C++ 函数 findAudioStreamIndex（使用 FFmpeg）
        // 返回类型：stream_index (>= 0) 表示找到音频流，-1 表示未找到，-2 表示错误
        const result = Module.ccall('findAudioStreamIndex', 'number', ['number', 'number'], [ptr, length]) as number

        if (result === -2) {
          setError('检测失败：无效的文件数据或 FFmpeg 错误')
        } else if (result === -1) {
          setStreamIndex(-1) // 未找到音频流
        } else if (result >= 0) {
          setStreamIndex(result) // 找到音频流，返回 stream_index
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        setError('调用失败: ' + errorMessage)
        console.error('调用失败:', e)
      } finally {
        // 释放内存
        Module._free(ptr)
        setLoading(false)
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      setError('文件读取失败: ' + errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="component-card">
      <h2>音频流检测</h2>
      <p className="description">上传 MP4 文件，通过 WASM 检测音频流并返回 stream_index</p>

      <div className="file-upload-area">
        <label htmlFor="video-file-input" className="file-input-label">
          <span className="upload-icon">📁</span>
          <span className="upload-text">
            {file ? file.name : '点击选择 MP4 文件'}
          </span>
        </label>
        <input
          id="video-file-input"
          type="file"
          accept="video/mp4,.mp4"
          onChange={handleFileChange}
          className="file-input"
          disabled={!wasmReady || loading}
        />
      </div>

      {file && (
        <div className="button-container">
          <button
            onClick={handleCheckAudioStream}
            disabled={!wasmReady || loading}
            className="check-button"
          >
            {loading ? '检测中...' : '检测音频流'}
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-message">正在检测音频流...</div>
      )}

      {error && (
        <div className="error-message">✗ {error}</div>
      )}

      {file && streamIndex !== null && !loading && (
        <div className="file-info">
          <div className="info-row">
            <span className="info-label">文件名：</span>
            <span className="info-value">{file.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">文件类型：</span>
            <span className="info-value">{file.type || 'video/mp4'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">音频流检测结果：</span>
            <span className={`info-value ${streamIndex >= 0 ? 'has-audio' : 'no-audio'}`}>
              {streamIndex >= 0 ? `✓ 找到音频流，stream_index: ${streamIndex}` : '✗ 未找到音频流'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoStreamDetector

