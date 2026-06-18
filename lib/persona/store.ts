"use client";

import { useSyncExternalStore } from "react";
import type { CharacterDetail } from "@/lib/characters/types";
import {
  EMPTY_PERSONA,
  SEED_PLACEHOLDER,
  type Persona,
} from "./types";

/**
 * 최소 persona 스토어.
 *
 * 영구 저장(DB 적재)은 이번 범위 밖이므로 localStorage 에만 보관한다.
 * 갤러리에서 시드를 주입하면 같은 탭/다른 탭의 편집 화면이 이를 구독해
 * 즉시 반영한다.
 */
const STORAGE_KEY = "doraemon.persona";

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): Persona {
  if (typeof window === "undefined") return EMPTY_PERSONA;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PERSONA;
    return { ...EMPTY_PERSONA, ...(JSON.parse(raw) as Partial<Persona>) };
  } catch {
    return EMPTY_PERSONA;
  }
}

function emit() {
  for (const l of listeners) l();
}

export function getPersona(): Persona {
  return read();
}

export function setPersona(persona: Persona): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persona));
  emit();
}

export function updatePersona(patch: Partial<Persona>): void {
  setPersona({ ...read(), ...patch });
}

/**
 * 캐릭터 상세를 페르소나 초기값으로 매핑한다.
 * - name: kanji 가 있으면 병기
 * - avatar: 이미지 URL(없으면 null)
 * - seedDescription: about 영문 원문, 비면 placeholder
 * - sourceRef: { provider: "jikan", malId }
 */
export function seedFromCharacter(detail: CharacterDetail): Persona {
  const name = detail.kanji
    ? `${detail.name} (${detail.kanji})`
    : detail.name;
  const persona: Persona = {
    name,
    avatar: detail.image,
    seedDescription: detail.about?.trim() || SEED_PLACEHOLDER,
    sourceRef: { provider: "jikan", malId: detail.id },
  };
  setPersona(persona);
  return persona;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  // 다른 탭에서의 변경도 반영한다.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** 편집 화면 등에서 페르소나를 구독하는 React 훅. */
export function usePersona(): Persona {
  return useSyncExternalStore(subscribe, read, () => EMPTY_PERSONA);
}
