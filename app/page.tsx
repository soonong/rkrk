import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">도라에몽 봇</h1>
      <p className="text-white/70">
        캐릭터를 검색해 이미지 갤러리에서 고르고, 선택한 캐릭터를 봇 페르소나
        초기값으로 주입합니다.
      </p>
      <div className="flex gap-4">
        <Link
          href="/characters"
          className="rounded-lg bg-white px-4 py-2 font-medium text-black hover:bg-white/90"
        >
          캐릭터 갤러리 열기
        </Link>
        <Link
          href="/persona"
          className="rounded-lg border border-white/20 px-4 py-2 font-medium hover:bg-white/10"
        >
          페르소나 편집
        </Link>
      </div>
    </div>
  );
}
