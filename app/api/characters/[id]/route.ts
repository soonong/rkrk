import { getCharacter, JikanError } from "@/lib/characters/jikan";

// 상세 데이터도 검색과 동일하게 하루 단위로 서버 캐시한다.
export const revalidate = 86400;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const malId = Number(id);
  if (!Number.isInteger(malId) || malId <= 0) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    const data = await getCharacter(malId);
    return Response.json({ data });
  } catch (err) {
    if (err instanceof JikanError) {
      // 존재하지 않는 캐릭터는 404 그대로, 그 외 Jikan 오류는 502.
      const status = err.status === 404 ? 404 : 502;
      return Response.json({ error: err.message }, { status });
    }
    console.error("[api/characters/:id] unexpected error:", err);
    return Response.json({ error: "internal error" }, { status: 500 });
  }
}
