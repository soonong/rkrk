import type { Character, CharacterDetail } from "./types";

const JIKAN_BASE = "https://api.jikan.moe/v4";

// 캐릭터 데이터는 거의 변하지 않으므로 하루 단위로 서버 캐시한다.
const REVALIDATE_SECONDS = 86400;

/**
 * Jikan 호출 중 비정상 응답을 구분하기 위한 에러.
 * 라우트에서 status 를 그대로 매핑할 수 있도록 상태코드를 보존한다.
 */
export class JikanError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "JikanError";
  }
}

interface JikanRawCharacter {
  mal_id: number;
  name?: string;
  name_kanji?: string | null;
  nicknames?: string[];
  favorites?: number;
  images?: {
    jpg?: { image_url?: string | null };
  };
}

interface JikanRawDetail extends JikanRawCharacter {
  about?: string | null;
  anime?: {
    anime?: { mal_id?: number; title?: string };
  }[];
}

function mapCharacter(raw: JikanRawCharacter): Character {
  return {
    id: raw.mal_id,
    name: raw.name ?? "(이름 없음)",
    kanji: raw.name_kanji ?? null,
    image: raw.images?.jpg?.image_url ?? null,
    favorites: raw.favorites ?? 0,
    nicknames: raw.nicknames ?? [],
  };
}

async function jikanFetch<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${JIKAN_BASE}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch (err) {
    // 네트워크 자체가 실패한 경우(샌드박스/CSP/타임아웃 등).
    console.error(`[jikan] network error for ${path}:`, err);
    throw new JikanError("jikan unreachable", 502);
  }

  if (!res.ok) {
    // 429(레이트리밋) / 5xx 등은 상태코드를 로깅해 둔다.
    console.error(`[jikan] non-ok response ${res.status} for ${path}`);
    throw new JikanError(`jikan ${res.status}`, res.status);
  }

  return (await res.json()) as T;
}

export async function searchCharacters(q: string): Promise<Character[]> {
  const url = `/characters?q=${encodeURIComponent(
    q,
  )}&order_by=favorites&sort=desc&limit=12`;
  const json = await jikanFetch<{ data?: JikanRawCharacter[] }>(url);
  return (json.data ?? []).map(mapCharacter);
}

export async function getCharacter(id: number): Promise<CharacterDetail> {
  const json = await jikanFetch<{ data?: JikanRawDetail }>(
    `/characters/${id}/full`,
  );
  const raw = json.data;
  if (!raw) {
    throw new JikanError("character not found", 404);
  }

  const anime = (raw.anime ?? [])
    .map((entry) => entry.anime)
    .filter(
      (a): a is { mal_id: number; title: string } =>
        typeof a?.mal_id === "number" && typeof a?.title === "string",
    )
    .map((a) => ({ id: a.mal_id, title: a.title }));

  return {
    ...mapCharacter(raw),
    about: raw.about ?? null,
    anime,
  };
}
