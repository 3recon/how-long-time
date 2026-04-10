import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "민원나우",
  description:
    "대기 인원과 이동 시간을 함께 고려해 방문할 민원실을 추천하는 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
