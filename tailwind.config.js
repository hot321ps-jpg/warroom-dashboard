/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}", // 如果您有建這個資料夾的話
    "./*.{js,ts,jsx,tsx}" 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
