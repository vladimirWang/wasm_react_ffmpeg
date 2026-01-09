import { useState, useEffect } from 'react'
import SumArray from './components/SumArray'
import MazeCanvas from './pages/MazeCanvas'
import FileSizeCalculator from './components/FileSizeCalculator'
import VideoStreamDetector from './components/VideoStreamDetector'
import type { EmscriptenModule } from './types/wasm'
import Editor from './pages/Editor'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './Home'
import './App.css'

function App() {
  const [wasmReady, setWasmReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 检查是否已经加载过脚本
    if (document.querySelector('script[src="/output.js"]')) {
      console.log("WASM 脚本已存在，跳过重复加载");
      // 如果 Module 已经初始化，直接设置状态
      if (window.Module && window.Module.asm) {
        setWasmReady(true);
      }
      return;
    }

    // 配置 Module 对象
    if (!window.Module) {
      window.Module = {
        noInitialRun: true,
        onRuntimeInitialized() {
          console.log("WASM 模块已初始化");
          setWasmReady(true);
        },
        onAbort: (error: any) => {
          console.error("WASM 加载失败:", error);
          setError("WASM 模块加载失败");
        },
      } as EmscriptenModule;
    } else {
      // 如果 Module 已存在，更新回调
      window.Module.noInitialRun = true;
      window.Module.onRuntimeInitialized = () => {
        console.log("WASM 模块已初始化");
        setWasmReady(true);
      };
      window.Module.onAbort = (error: any) => {
        console.error("WASM 加载失败:", error);
        setError("WASM 模块加载失败");
      };
    }

    // 动态加载 WASM 胶水代码
    const script = document.createElement("script");
    script.src = "/output.js";
    script.async = true;
    script.onerror = () => {
      setError("无法加载 output.js 文件");
    };
    document.body.appendChild(script);

    return () => {
      // 清理（但保留脚本，避免重复加载问题）
      // 不删除脚本，因为可能被其他组件使用
    };
  }, []);

  return (
    <div className="app-container">
      <div className="header">
        <h1>WASM React 示例</h1>
        <div className="status">
          {!wasmReady && !error && (
            <div className="status-loading">正在加载 WASM 模块...</div>
          )}
          {wasmReady && <div className="status-ready">✓ WASM 模块已就绪</div>}
          {error && <div className="status-error">✗ {error}</div>}
        </div>
      </div>
      {/* <div className="components-container">
        
        <FileSizeCalculator wasmReady={wasmReady} Module={window.Module} />
        <VideoStreamDetector wasmReady={wasmReady} Module={window.Module} />
      </div> */}
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />}/>
              <Route path='/sumArray' element={<SumArray wasmReady={wasmReady} Module={window.Module} />}/>
              <Route path='/mazeCanvas' element={<MazeCanvas />}/>
              <Route path='/editor' element={<Editor />}/>
              <Route path="*" element={<Navigate to="/" replace={true} />} />
            </Routes>
          </BrowserRouter>
    </div>
  );
}

export default App;
