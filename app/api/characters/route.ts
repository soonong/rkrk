import { JikanError, searchCharacters } from "@/lib/characters/jikan";

// 캐릭터 데이터는 거의 변하지 않으므로 하루 단위로 서버 캐시한다.
export const revalidate = 86400;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return Response.json({ error: "missing q" }, { status: 400 });
  }

  try {
    const data = await searchCharacters(q);
    return Response.json({ data });
  } catch (err) {
    if (err instanceof JikanError) {
      return Response.json({ error: err.message }, { status: 502 });
    }
    console.error("[api/characters] unexpected error:", err);
    return Response.json({ error: "internal error" }, { status: 500 });
  }
}
