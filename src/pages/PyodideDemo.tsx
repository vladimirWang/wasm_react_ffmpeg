import { useState } from "react";
import { Upload, Card, Tag, Button } from "antd";
import { UploadOutlined, StarOutlined } from "@ant-design/icons";
import ImageProcessDrawer from "../components/ImageProcessDrawer";
import type { ProcessResult } from "../types/pyodide";

export default function PyodideDemo() {
	const [imageUrl, setImageUrl] = useState<string>("");
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [originalFile, setOriginalFile] = useState<File | Blob | null>(null);
	const [originalUrl, setOriginalUrl] = useState<string>("");

	const handleUpload = (file: File) => {
		setOriginalFile(file);
		const url = URL.createObjectURL(file);
		setOriginalUrl(url);
		setImageUrl(url);
		// 自动打开处理抽屉
		setDrawerOpen(true);
	};

	const handleUseResult = (result: ProcessResult) => {
		const blob = new Blob([result.image as any], { type: result.mimeType });
		setImageUrl(URL.createObjectURL(blob));
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-6 md:p-10">
			<div className="max-w-5xl mx-auto">
				{/* 标题区 */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-800 mb-3">
						<span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
							Pyodide Wasm AI 图片处理
						</span>
					</h1>
					<p className="text-gray-500 max-w-xl mx-auto">
						上传图片后自动 AI 处理，右侧抽屉展示结果，点击颜色切换背景
					</p>
					<div className="flex justify-center gap-2 mt-4">
						<Tag color="orange">Python Wasm</Tag>
						<Tag color="blue">本地处理</Tag>
						<Tag color="green">隐私安全</Tag>
						<Tag color="purple">零后端</Tag>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* 左侧：上传区 */}
					<div className="lg:col-span-2">
						<Card title="产品图片" size="small" className="shadow-sm">
							<div className="space-y-4">
								{/* 上传区域 */}
								<Upload
									accept="image/*"
									showUploadList={false}
									customRequest={({ file }) => {
										handleUpload(file as File);
									}}
								>
									{imageUrl ? (
										<div className="relative w-[120px] h-[120px] rounded-lg border border-gray-200 overflow-hidden group cursor-pointer">
											<img
												src={imageUrl}
												alt="产品图"
												className="w-full h-full object-cover"
											/>
											<div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
												<span className="text-white text-xs">点击重新上传</span>
											</div>
										</div>
									) : (
										<div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-orange-400 hover:bg-orange-50/30 transition-all duration-200 cursor-pointer">
											<UploadOutlined className="text-4xl text-gray-300 mb-3" />
											<p className="text-base text-gray-500">点击上传产品图片</p>
											<p className="text-xs text-gray-400 mt-1">
												JPG / PNG / WEBP · 上传后自动 AI 处理
											</p>
										</div>
									)}
								</Upload>

								{/* 说明 */}
								{imageUrl && (
									<div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700 space-y-1">
										<p>
											<StarOutlined className="mr-1" />
											<strong>使用提示：</strong>
										</p>
										<ul className="list-disc list-inside space-y-0.5 ml-1">
											<li>上传图片后会自动弹出处理结果抽屉</li>
											<li>点击背景色可以实时切换处理后图片的底色</li>
											<li>点击「使用处理结果」确认应用</li>
										</ul>
									</div>
								)}

								{/* 手动打开抽屉按钮 */}
								{imageUrl && (
									<Button
										type="primary"
										icon={<StarOutlined />}
										onClick={() => setDrawerOpen(true)}
										className="!bg-orange-500 hover:!bg-orange-600"
									>
										打开 AI 处理
									</Button>
								)}
							</div>
						</Card>
					</div>

					{/* 右侧：功能说明 */}
					<div className="space-y-4">
						<Card size="small" className="shadow-sm">
							<h3 className="font-semibold text-gray-800 mb-3">✨ 交互流程</h3>
							<ol className="space-y-2 text-xs text-gray-500 list-decimal list-inside">
								<li>上传产品图片</li>
								<li>自动开始 AI 处理</li>
								<li>右侧抽屉弹出结果</li>
								<li>点击颜色切换背景</li>
								<li>确认使用处理结果</li>
							</ol>
						</Card>

						<Card size="small" className="shadow-sm">
							<h3 className="font-semibold text-gray-800 mb-3">🎨 背景色切换</h3>
							<ul className="space-y-1.5 text-xs text-gray-500">
								<li>• 8 种电商常用预设底色</li>
								<li>• 支持自定义颜色选择器</li>
								<li>• 点击即实时预览效果</li>
								<li>• 方形补边 800×800</li>
							</ul>
						</Card>

						<Card size="small" className="shadow-sm">
							<h3 className="font-semibold text-gray-800 mb-3">🛡️ 隐私保护</h3>
							<ul className="space-y-1.5 text-xs text-gray-500">
								<li>• 所有处理在浏览器本地完成</li>
								<li>• 图片数据不上传服务器</li>
								<li>• Pyodide + Pillow Python 生态</li>
								<li>• 首次加载 ~15MB，后续无延迟</li>
							</ul>
						</Card>
					</div>
				</div>
			</div>

			{/* AI 图片处理结果抽屉 */}
			<ImageProcessDrawer
				open={drawerOpen}
				originalFile={originalFile}
				originalUrl={originalUrl}
				onClose={() => setDrawerOpen(false)}
				onUseResult={handleUseResult}
				onKeepOriginal={() => {}}
				onReupload={() => {
					setImageUrl("");
					setOriginalFile(null);
					setOriginalUrl("");
				}}
			/>
		</div>
	);
}
