export interface Character {
  id: number; // mal_id
  name: string;
  kanji: string | null; // name_kanji
  image: string | null; // images.jpg.image_url
  favorites: number;
  nicknames: string[];
}

export interface CharacterDetail extends Character {
  about: string | null; // 영문 원문 (번역은 후속 과제)
  anime: { id: number; title: string }[];
}
