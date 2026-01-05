// Emscripten WASM Module 类型定义
export interface EmscriptenModule {
  // 内存堆
  HEAP8: Int8Array;
  HEAP16: Int16Array;
  HEAP32: Int32Array;
  HEAPU8: Uint8Array;
  HEAPU16: Uint16Array;
  HEAPU32: Uint32Array;
  HEAPF32: Float32Array;
  HEAPF64: Float64Array;

  // 内存管理
  _malloc(size: number): number;
  _free(ptr: number): void;

  // 函数调用
  ccall(
    ident: string,
    returnType: string,
    argTypes: string[],
    args: any[]
  ): any;
  cwrap(
    ident: string,
    returnType: string,
    argTypes: string[]
  ): (...args: any[]) => any;

  // 运行时状态
  asm: any;
  noInitialRun?: boolean;
  onRuntimeInitialized?: () => void;
  onAbort?: (error: any) => void;
}

// 扩展 Window 接口
declare global {
  interface Window {
    Module?: EmscriptenModule;
  }
}

export {};

