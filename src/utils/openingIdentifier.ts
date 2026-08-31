import { getFenKey, CURATED_OPENING_TREE } from "../data/openingTree";

export interface IdentifiedOpening {
  eco: string;
  name: string;
}

export function identifyOpeningFromFen(fen: string): IdentifiedOpening {
  const key = getFenKey(fen);
  const entry = CURATED_OPENING_TREE[key];

  if (entry) {
    return {
      eco: entry.eco,
      name: entry.openingName,
    };
  }

  return {
    eco: "Custom",
    name: "Exploration Line",
  };
}
