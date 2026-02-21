import SparkMD5 from "spark-md5";

// 分块读取大文件，避免内存占用过大
export async function md5File(file: File): Promise<string> {
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
