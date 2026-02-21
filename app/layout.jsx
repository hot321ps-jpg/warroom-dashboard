import "./globals.css";

export const metadata = {
  title: "Warroom · Apple Minimal",
  description: "Apple style clean minimal warroom dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
