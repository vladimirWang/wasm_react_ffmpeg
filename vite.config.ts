import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
	base: "./",
	server: {
		port: 5174,
		proxy: {
			"/nodejs_api": {
				target: "http://localhost:4000",
				changeOrigin: true,
			},
			"/uploads": {
				target: "http://localhost:4000",
				changeOrigin: true,
			},
			"/go_api": {
				target: "http://localhost:8888",
				changeOrigin: true,
			},
		},
	},
	plugins: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		tailwindcss(),
	],
	// server: {
	//   port: 3000
	// },
	optimizeDeps: {
		// onnxruntime-web 必须排除预打包：esbuild 会抹掉其动态 import 上的
		// /* @vite-ignore */，导致 Vite 把运行时 import() 的 /public 胶水 .mjs
		// 当作源码模块解析而报错；排除后浏览器以原生动态 import 直接加载。
		exclude: ["monaco-editor", "onnxruntime-web"],
	},
	// 确保开发模式下生成 source map
	build: {
		sourcemap: true,
		chunkSizeWarningLimit: 800, // 提高警告阈值，拆分后单 chunk 会更小
		rollupOptions: {
			output: {
				manualChunks: {
					"vendor-react": ["react", "react-dom", "react-router-dom"],
					"vendor-antd": ["antd", "@ant-design/icons"],
					"vendor-charts": ["@ant-design/charts"],
					"vendor-three": ["three", "@react-three/fiber"],
					"vendor-konva": ["konva", "react-konva"],
					"vendor-xlsx": ["xlsx"],
				},
			},
		},
	},
	// 开发模式下的 source map 配置
	css: {
		devSourcemap: true, // CSS source map
	},
});
