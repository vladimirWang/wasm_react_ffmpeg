import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
	server: {
		proxy: {
			"/nodejs_api": {
				target: "http://localhost:3000",
				changeOrigin: true,
			},
			"/go_api": {
				target: "http://localhost:3000",
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
		exclude: ["monaco-editor"],
	},
	// 确保开发模式下生成 source map
	build: {
		sourcemap: true, // 生产构建时也生成 source map（可选）
	},
	// 开发模式下的 source map 配置
	css: {
		devSourcemap: true, // CSS source map
	},
});
