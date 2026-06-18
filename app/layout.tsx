import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "도라에몽 봇 — 캐릭터 갤러리",
  description: "Jikan 캐릭터 검색 & 페르소나 시드 연동",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <header className="border-b border-white/10">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4">
            <Link href="/" className="font-semibold">
              🤖 도라에몽 봇
            </Link>
            <Link href="/characters" className="text-sm text-white/70 hover:text-white">
              캐릭터 갤러리
            </Link>
            <Link href="/persona" className="text-sm text-white/70 hover:text-white">
              페르소나 편집
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
