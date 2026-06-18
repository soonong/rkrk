/** 페르소나 데이터의 출처 추적용 참조. */
export interface PersonaSourceRef {
  provider: string; // 예: "jikan"
  malId: number;
}

/**
 * 봇 페르소나 초기값.
 * 말투/상태(state) 튜닝, about 한글 번역 등은 이 시드 위에서
 * 편집 대시보드가 이어서 채운다(이번 범위 밖).
 */
export interface Persona {
  name: string;
  avatar: string | null;
  seedDescription: string;
  sourceRef: PersonaSourceRef | null;
}

export const SEED_PLACEHOLDER =
  "(자기소개 정보가 없습니다. 페르소나 편집 화면에서 직접 작성하세요.)";

export const EMPTY_PERSONA: Persona = {
  name: "",
  avatar: null,
  seedDescription: "",
  sourceRef: null,
};
