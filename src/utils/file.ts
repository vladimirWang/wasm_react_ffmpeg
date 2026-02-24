import SparkMD5 from "spark-md5";
import type { EmscriptenModule } from "../types/wasm";

/** 默认分片大小：100MB */
export const DEFAULT_CHUNK_SIZE = 100 * 1024 * 1024;

// 分块读取大文件，避免内存占用过大
export async function md5File(file: File | Blob): Promise<string> {
	const spark = new SparkMD5.ArrayBuffer();
	const chunkSize = 2 * 1024 * 1024; // 2MB
	let offset = 0;

	while (offset < file.size) {
		const chunk = file.slice(offset, offset + chunkSize);
		const buffer = await chunk.arrayBuffer();
		spark.append(buffer);
		offset += chunkSize;
	}
	return spark.end();
}

/**
 * 使用 WASM 将文件分片，每片 100MB，返回分片数组
 * @param file 要分片的文件
 * @param Module WASM 模块（需已初始化）
 * @param chunkSize 每片大小（字节），默认 100MB
 * @returns 分片后的 Uint8Array 数组
 */
export async function chunkFileWithWasm(
	file: File,
	Module: EmscriptenModule,
	chunkSize: number = DEFAULT_CHUNK_SIZE
): Promise<Uint8Array[]> {
	if (!Module?.ccall || !Module._malloc || !Module._free || !Module.HEAPU8) {
		throw new Error("WASM 模块未就绪");
	}

	const arrayBuffer = await file.arrayBuffer();
	const fileData = new Uint8Array(arrayBuffer);
	const fileDataLen = fileData.length;

	if (fileDataLen === 0) return [];

	// 分配 WASM 内存并复制文件数据
	const filePtr = Module._malloc(fileDataLen);
	if (!filePtr) throw new Error("内存分配失败");

	try {
		Module.HEAPU8.set(fileData, filePtr);

		const chunkCount = Module.ccall(
			"getChunkCount",
			"number",
			["number", "number"],
			[fileDataLen, chunkSize]
		) as number;

		const chunks: Uint8Array[] = [];

		for (let i = 0; i < chunkCount; i++) {
			// 分配输出缓冲区（最大 chunkSize 字节）
			const outputPtr = Module._malloc(chunkSize);
			if (!outputPtr) throw new Error(`分片 ${i} 内存分配失败`);

			try {
				const actualSize = Module.ccall(
					"copyChunk",
					"number",
					["number", "number", "number", "number", "number"],
					[filePtr, fileDataLen, chunkSize, i, outputPtr]
				) as number;

				if (actualSize < 0) throw new Error(`分片 ${i} 复制失败`);

				// 从 WASM 堆复制到新的 Uint8Array（深拷贝，避免 WASM 内存释放后失效）
				const chunk = new Uint8Array(actualSize);
				chunk.set(Module.HEAPU8.subarray(outputPtr, outputPtr + actualSize));
				chunks.push(chunk);
			} finally {
				Module._free(outputPtr);
			}
		}

		return chunks;
	} finally {
		Module._free(filePtr);
	}
}
