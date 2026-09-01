import { getFenKey, CURATED_OPENING_TREE } from "../data/openingTree";
import type { StaticTreePosition } from "../data/openingTree";
import type { ExplorerMove } from "../hooks/useLichessExplorer";

export interface IdentifiedOpening {
  eco: string;
  name: string;
}

export interface MasterBookPosition {
  openingName?: string;
  eco?: string;
  moves: ExplorerMove[];
  totalGames: number;
}

const masterBookCache = new Map<string, MasterBookPosition | null>();

export function identifyOpeningFromFen(fen: string): IdentifiedOpening {
  const entry = getMasterBookData(fen);
  return entry
    ? { eco: entry.eco, name: entry.openingName }
    : { eco: "Custom", name: "Exploration Line" };
}

export function getMasterBookData(fen: string): StaticTreePosition | null {
  const key = getFenKey(fen);
  return CURATED_OPENING_TREE[key] || null;
}

/**
 * Fetches master games statistics & opening identification for a given FEN.
 * Uses in-memory session cache and falls back to local curated tree if offline or rate limited.
 */
export async function fetchMasterOpeningData(
  fen: string,
  signal?: AbortSignal
): Promise<MasterBookPosition | null> {
  const key = getFenKey(fen);
  if (masterBookCache.has(key)) {
    return masterBookCache.get(key) || null;
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("lichess_api_token") || ""
      : "";

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(
      `https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}&topGames=5`,
      { headers, signal }
    );

    if (!res.ok) {
      throw new Error(`Master explorer API returned status ${res.status}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedMoves: ExplorerMove[] = (json.moves || []).map((m: any) => {
      const total = (m.white || 0) + (m.draws || 0) + (m.black || 0);
      const safeTotal = total > 0 ? total : 1;
      return {
        san: m.san,
        uci: m.uci,
        white: m.white || 0,
        draws: m.draws || 0,
        black: m.black || 0,
        averageRating: m.averageRating || 2500,
        totalGames: total,
        whiteWinPct: Math.round(((m.white || 0) / safeTotal) * 100),
        drawPct: Math.round(((m.draws || 0) / safeTotal) * 100),
        blackWinPct: Math.round(((m.black || 0) / safeTotal) * 100),
      };
    });

    const totalPositionGames =
      (json.white || 0) + (json.draws || 0) + (json.black || 0);

    const positionData: MasterBookPosition = {
      openingName: json.opening?.name || undefined,
      eco: json.opening?.eco || undefined,
      moves: processedMoves,
      totalGames: totalPositionGames,
    };

    masterBookCache.set(key, positionData);
    return positionData;
  } catch {
    // Fallback to local curated static tree if fetch fails or offline
    const local = getMasterBookData(fen);
    if (local) {
      const fallbackData: MasterBookPosition = {
        openingName: local.openingName,
        eco: local.eco,
        moves: local.moves,
        totalGames: local.moves.reduce((sum, m) => sum + m.totalGames, 0),
      };
      masterBookCache.set(key, fallbackData);
      return fallbackData;
    }
    masterBookCache.set(key, null);
    return null;
  }
}


