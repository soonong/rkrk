"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Character, CharacterDetail } from "@/lib/characters/types";
import { seedFromCharacter } from "@/lib/persona/store";

type Status = "idle" | "loading" | "loaded" | "error";

export default function CharactersPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Character[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [seedingId, setSeedingId] = useState<number | null>(null);

  // 동일 검색어 연타 시 이전 요청을 취소한다.
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (!q) {
      // q 공백 → 호출하지 않고 입력 유도
      setStatus("idle");
      setResults([]);
      setErrorMsg(null);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setStatus("loading");
    setErrorMsg(null);

    try {
      // 외부 도메인 직접 호출 금지 — 내부 BFF 만 호출한다.
      const res = await fetch(`/api/characters?q=${encodeURIComponent(q)}`, {
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        // 레이트리밋(429)/5xx 가능성을 사용자에게 명시
        setErrorMsg(
          "캐릭터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요. (요청이 많을 경우 레이트리밋이 걸릴 수 있습니다)",
        );
        console.error("[characters] search failed:", res.status, body?.error);
        setStatus("error");
        return;
      }

      const json = (await res.json()) as { data?: Character[] };
      setResults(json.data ?? []);
      setStatus("loaded");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // 이전 요청 취소 — 무시
        return;
      }
      console.error("[characters] search error:", err);
      setErrorMsg("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setStatus("error");
    }
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void search(query);
  };

  const onSelect = useCallback(
    async (character: Character) => {
      setSeedingId(character.id);
      try {
        // 선택 시 상세를 불러와 about 까지 채운 뒤 페르소나 초기값으로 주입
        const res = await fetch(`/api/characters/${character.id}`);
        if (!res.ok) {
          setErrorMsg(
            "상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          );
          setStatus("error");
          return;
        }
        const json = (await res.json()) as { data?: CharacterDetail };
        if (!json.data) {
          setErrorMsg("상세 정보가 비어 있습니다.");
          setStatus("error");
          return;
        }
        seedFromCharacter(json.data);
        // 편집 대시보드로 이동해 주입 결과 확인
        router.push("/persona");
      } catch (err) {
        console.error("[characters] seed error:", err);
        setErrorMsg("페르소나 주입 중 오류가 발생했습니다.");
        setStatus("error");
      } finally {
        setSeedingId(null);
      }
    },
    [router],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">캐릭터 갤러리</h1>
        <p className="mt-1 text-sm text-amber-300/80">
          검색은 영문 이름 기준입니다.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="영문 이름으로 검색 (예: Doraemon, Luffy)"
          className="flex-1 rounded-md border border-white/15 bg-black/30 px-4 py-2 text-sm"
          aria-label="캐릭터 검색"
        />
        <button
          type="submit"
          className="rounded-md bg-white px-5 py-2 text-sm font-medium text-black hover:bg-white/90"
        >
          검색
        </button>
      </form>

      {status === "loading" && <SkeletonGrid />}

      {status === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {errorMsg}
        </div>
      )}

      {status === "loaded" && results.length === 0 && (
        <div className="rounded-lg border border-white/15 bg-white/5 p-6 text-sm text-white/70">
          결과가 없습니다. 영문 이름으로 다시 시도해 보세요.
        </div>
      )}

      {status === "loaded" && results.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {results.map((c) => (
            <CharacterTile
              key={c.id}
              character={c}
              seeding={seedingId === c.id}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}

      {status === "idle" && (
        <p className="text-sm text-white/40">
          검색어를 입력하고 검색하면 캐릭터가 이미지 격자로 표시됩니다.
        </p>
      )}
    </div>
  );
}

function CharacterTile({
  character,
  seeding,
  onSelect,
}: {
  character: Character;
  seeding: boolean;
  onSelect: (c: Character) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = character.image && !imgFailed;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(character)}
        disabled={seeding}
        className="group flex w-full flex-col overflow-hidden rounded-lg border border-white/10 bg-white/5 text-left transition hover:border-white/30 disabled:opacity-60"
        title={`${character.name} 을(를) 페르소나로 주입`}
      >
        <div className="relative aspect-[3/4] w-full bg-white/10">
          {showImage ? (
            // 외부 이미지: next/image 원격 설정을 피하고 onError 폴백을 쓰기 위해 plain img 사용
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={character.image!}
              alt={character.name}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
              이미지 없음
            </div>
          )}
          {seeding && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs">
              주입 중…
            </div>
          )}
        </div>
        <div className="space-y-1 p-2">
          <p className="truncate text-sm font-medium">{character.name}</p>
          <p className="text-xs text-white/50">
            ♥ {character.favorites.toLocaleString()}
          </p>
        </div>
      </button>
    </li>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i}>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
            <div className="aspect-[3/4] w-full animate-pulse bg-white/10" />
            <div className="space-y-2 p-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
