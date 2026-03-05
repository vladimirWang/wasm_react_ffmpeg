/**
 * Web Worker 使用范例
 * 在独立线程中接收 File，计算 MD5 hash，避免阻塞主线程
 */
import SparkMD5 from "spark-md5";

export type WorkerMessage = { type: "compute"; payload: { file: File } } | { type: "ping" };

export type WorkerResult =
	| { type: "computed"; payload: { hash: string; duration: number } }
	| { type: "pong"; payload: { timestamp: number } }
	| { type: "error"; payload: { message: string } };

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

function computeFileHash(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const spark = new SparkMD5();
		const chunks = Math.ceil(file.size / CHUNK_SIZE);

		function readChunk(index: number) {
			if (index >= chunks) {
				resolve(spark.end());
				return;
			}
			const start = index * CHUNK_SIZE;
			const end = Math.min(start + CHUNK_SIZE, file.size);
			const chunk = file.slice(start, end);
			const reader = new FileReader();
			reader.readAsArrayBuffer(chunk);
			reader.onload = () => {
				spark.append(reader.result as ArrayBuffer);
				readChunk(index + 1);
			};
			reader.onerror = () => reject(reader.error);
		}
		readChunk(0);
	});
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
	const msg = e.data;

	try {
		switch (msg.type) {
			case "compute": {
				const { file } = msg.payload;
				if (!file || !(file instanceof File)) {
					throw new Error("payload.file 必须是 File 对象");
				}
				const start = performance.now();
				const hash = await computeFileHash(file);
				const duration = performance.now() - start;
				const response: WorkerResult = {
					type: "computed",
					payload: { hash, duration },
				};
				self.postMessage(response);
				break;
			}
			case "ping": {
				const response: WorkerResult = {
					type: "pong",
					payload: { timestamp: Date.now() },
				};
				self.postMessage(response);
				break;
			}
			default:
				throw new Error(`未知消息类型: ${(msg as WorkerMessage).type}`);
		}
	} catch (err) {
		const response: WorkerResult = {
			type: "error",
			payload: { message: (err as Error).message },
		};
		self.postMessage(response);
	}
};
