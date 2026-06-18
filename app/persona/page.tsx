"use client";

import { updatePersona, usePersona } from "@/lib/persona/store";

export default function PersonaPage() {
  const persona = usePersona();
  const hasSeed = persona.name || persona.seedDescription || persona.avatar;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">페르소나 편집</h1>
        <p className="mt-1 text-sm text-white/60">
          갤러리에서 주입한 초기값을 여기서 확인하고 이어서 편집합니다. (말투/상태
          튜닝, about 한글 번역은 후속 과제)
        </p>
      </div>

      {!hasSeed && (
        <div className="rounded-lg border border-white/15 bg-white/5 p-6 text-sm text-white/70">
          아직 주입된 페르소나가 없습니다.{" "}
          <a href="/characters" className="underline">
            캐릭터 갤러리
          </a>
          에서 캐릭터를 선택해 초기값을 주입하세요.
        </div>
      )}

      <div className="flex gap-6">
        <div className="shrink-0">
          {persona.avatar ? (
            // 외부 이미지: next/image 원격 설정을 피하고 onError 폴백을 쓰기 위해 plain img 사용
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={persona.avatar}
              alt={persona.name || "avatar"}
              className="h-40 w-32 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-40 w-32 items-center justify-center rounded-lg bg-white/10 text-xs text-white/40">
              이미지 없음
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <Field label="이름 (persona.name)">
            <input
              value={persona.name}
              onChange={(e) => updatePersona({ name: e.target.value })}
              className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm"
              placeholder="페르소나 이름"
            />
          </Field>

          <Field label="시드 설명 (persona.seedDescription · 영문 원문)">
            <textarea
              value={persona.seedDescription}
              onChange={(e) =>
                updatePersona({ seedDescription: e.target.value })
              }
              rows={6}
              className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm leading-relaxed"
              placeholder="캐릭터 자기소개(about)"
            />
          </Field>

          <Field label="출처 (persona.sourceRef)">
            <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/60">
              {persona.sourceRef
                ? `${persona.sourceRef.provider} · malId ${persona.sourceRef.malId}`
                : "—"}
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-white/50">{label}</span>
      {children}
    </label>
  );
}
