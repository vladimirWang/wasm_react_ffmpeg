import { useState, ChangeEvent } from 'react'
import type { EmscriptenModule } from '../types/wasm'
import './FileSizeCalculator.css'

interface FileSizeCalculatorProps {
  wasmReady: boolean
  Module?: EmscriptenModule
}

function FileSizeCalculator({ wasmReady, Module }: FileSizeCalculatorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    
    if (!selectedFile) {
      setFile(null)
      setFileSize(null)
      setError(null)
      return
    }

    // 检查文件类型
    if (selectedFile.type !== 'video/mp4' && !selectedFile.name.toLowerCase().endsWith('.mp4')) {
      setError('请选择 MP4 格式的视频文件')
      setFile(null)
      setFileSize(null)
      return
    }

    setError(null)
    setFile(selectedFile)
    setLoading(true)
    setFileSize(null)

    try {
      // 检查 WASM 模块是否就绪
      if (!wasmReady || !Module || !Module.ccall || !Module.HEAP8) {
        setError('WASM 模块未就绪')
        setLoading(false)
        return
      }

      // 读取文件为 ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer()
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

        // 调用 C++ 函数 calculateFileSize
        // 返回类型使用 'number'，C++ 函数返回 int64_t
        const size = Module.ccall('calculateFileSize', 'number', ['number', 'number'], [ptr, length]) as number

        if (size < 0) {
          setError('文件大小计算失败')
        } else {
          // 确保转换为普通数字（处理可能的 BigInt 情况）
          setFileSize(Number(size))
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

  const formatFileSize = (bytes: number): string => {
    // 确保 bytes 是数字类型（处理 BigInt 情况）
    const bytesNum = Number(bytes)
    
    if (bytesNum === 0 || isNaN(bytesNum)) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytesNum) / Math.log(k))
    
    return Math.round((bytesNum / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="component-card">
      <h2>MP4 文件大小计算</h2>
      <p className="description">上传 MP4 文件，通过 WASM 计算并显示文件大小</p>

      <div className="file-upload-area">
        <label htmlFor="mp4-file-input" className="file-input-label">
          <span className="upload-icon">📁</span>
          <span className="upload-text">
            {file ? file.name : '点击选择 MP4 文件'}
          </span>
        </label>
        <input
          id="mp4-file-input"
          type="file"
          accept="video/mp4,.mp4"
          onChange={handleFileChange}
          className="file-input"
          disabled={!wasmReady || loading}
        />
      </div>

      {loading && (
        <div className="loading-message">正在计算文件大小...</div>
      )}

      {error && (
        <div className="error-message">✗ {error}</div>
      )}

      {file && fileSize !== null && !loading && (
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
            <span className="info-label">文件大小（WASM 计算）：</span>
            <span className="info-value size-value">
              {formatFileSize(fileSize)}
              <span className="size-bytes">({fileSize.toLocaleString()} 字节)</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileSizeCalculator

