/** @type {import('tailwindcss').Config} */
module.exports = {
    // 按需调整路径，覆盖项目中所有使用 Tailwind 工具类的文件
    content: ["./src/**/*.{html,js,jsx,ts,tsx,vue,php}"],
    theme: {
      extend: {}, // 此处无需配置任何内容（无需 @theme 相关自定义）
    },
    plugins: [],
  }