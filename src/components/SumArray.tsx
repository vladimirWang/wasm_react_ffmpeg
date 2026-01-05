import { useState } from 'react'
import type { EmscriptenModule } from '../types/wasm'
import './SumArray.css'

interface SumArrayProps {
  wasmReady: boolean
  Module?: EmscriptenModule
}

function SumArray({ wasmReady, Module }: SumArrayProps) {
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCalculate = () => {
    if (!wasmReady || !Module || !Module.ccall || !Module.HEAP32) {
      setError('WASM 模块未就绪')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // 准备数组 [0, 1, 2, 3, 4, 5]
      const arr = [0, 1, 2, 3, 4, 5]
      const length = arr.length
      const bytesPerInt = Module.ccall('getIntSize', 'number', [], []) as number


      // 分配内存
      const ptr = Module._malloc(length * bytesPerInt)

      if (!ptr) {
        setError('内存分配失败')
        setLoading(false)
        return
      }

      try {
        // 将 JavaScript 数组复制到 WASM 内存
        const heap = Module.HEAP32
        const heapOffset = ptr / bytesPerInt; // 将字节指针转换为 32 位整数索引
        console.log("heap: ", heap, '; ptr: ', ptr, '; heapOffset: ', heapOffset)
        for (let i = 0; i < length; i++) {
          console.log("offset: ", heapOffset + i, '; value: ', arr[i])
          heap[heapOffset + i] = arr[i]
        }

        // 调用 C 函数 sumArray
        const sum = Module.ccall('sumArray', 'number', ['number', 'number'], [ptr, length]) as number

        // 显示结果
        setResult(sum)
        console.log('数组求和结果:', sum)
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
      setError('执行出错: ' + errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="component-card">
      <h2>数组求和</h2>
      <p className="description">使用 WebAssembly 计算数组 [0, 1, 2, 3, 4, 5] 的和</p>

      <button
        className="action-btn"
        onClick={handleCalculate}
        disabled={!wasmReady || loading}
      >
        {loading ? '计算中...' : '计算数组求和 (0-5)'}
      </button>

      {error && (
        <div className="error-message">✗ {error}</div>
      )}

      {result !== null && (
        <div className="result">
          <div className="result-label">计算结果：</div>
          <div className="result-value">
            数组 [0, 1, 2, 3, 4, 5] 的和为 <strong>{result}</strong>
          </div>
        </div>
      )}
    </div>
  )
}

export default SumArray

