/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 新增這行：掃描 src 資料夾底下的所有子資料夾與組件
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
