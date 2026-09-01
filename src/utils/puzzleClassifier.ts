import { Chess } from "chess.js";

export interface ClassifiedThemes {
  themes: string[];
  estimatedRating: number;
  description: string;
}

// Tactical Theme & Rating Estimator (fallback for untagged puzzles)
export function classifyPuzzle(fen: string, uciMoves: string[] = []): ClassifiedThemes {
  if (!uciMoves.length) {
    return { themes: ["Tactics"], estimatedRating: 1200, description: "Tactical position" };
  }

  const themes = new Set<string>(["Tactics"]);
  const plies = uciMoves.length;

  try {
    const game = new Chess(fen);
    for (const move of uciMoves) {
      const from = move.slice(0, 2);
      const to = move.slice(2, 4);
      const promotion = move.length > 4 ? move[4] : undefined;
      game.move({ from, to, promotion });
    }
    if (game.isCheckmate()) {
      themes.add("Checkmate Patterns");
    }
  } catch {
    // fallback
  }

  // Estimated rating based on sequence depth
  const baseRating = plies <= 2 ? 800 : plies <= 4 ? 1200 : plies <= 6 ? 1600 : 2000;

  return {
    themes: Array.from(themes),
    estimatedRating: baseRating,
    description: `${Array.from(themes).join(" & ")} tactical sequence (${plies} plies).`,
  };
}

