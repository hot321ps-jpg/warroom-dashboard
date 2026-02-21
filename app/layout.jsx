// 這裡非常重要！引入全域 CSS，Tailwind 才會生效
import './globals.css';

export const metadata = {
  title: '戰情室儀表板 | War Room',
  description: '頻道數據分析與戰略規劃',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      {/* 所有的頁面內容都會被注入到 children 這裡 */}
      <body className="antialiased bg-neutral-50">
        {children}
      </body>
    </html>
  );
}
