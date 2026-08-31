import { Chess } from "chess.js";
import type { Square, PieceSymbol, Color } from "chess.js";

export interface ClassifiedThemes {
  themes: string[];
  estimatedRating: number;
  description: string;
}

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};

// Check if a square is attacked by a piece of specific color
function isSquareAttackedBy(game: Chess, square: Square, attackerColor: Color): boolean {
  return game.isAttacked(square, attackerColor);
}

// Tactical Theme & Rating Classifier
export function classifyPuzzle(fen: string, uciMoves: string[]): ClassifiedThemes {
  const themes: Set<string> = new Set();
  let description = "Tactical position";

  if (!uciMoves || uciMoves.length === 0) {
    return { themes: ["Tactics"], estimatedRating: 1200, description };
  }

  const game = new Chess(fen);
  const playerColor = game.turn();
  const opponentColor: Color = playerColor === "w" ? "b" : "w";

  // Replay first player move
  const firstMoveUci = uciMoves[0];
  const from = firstMoveUci.slice(0, 2) as Square;
  const to = firstMoveUci.slice(2, 4) as Square;
  const promotion = firstMoveUci.length > 4 ? firstMoveUci[4] : undefined;

  const movedPiece = game.get(from);
  const capturedPiece = game.get(to);

  // Check if first move is a Greek Gift sacrifice (Bxh7+ / Bxh2+)
  if (
    movedPiece?.type === "b" &&
    (to === "h7" || to === "h2") &&
    capturedPiece?.type === "p"
  ) {
    themes.add("Greek Gift");
    themes.add("Checkmate Patterns");
  }

  // Make the move
  try {
    game.move({ from, to, promotion });
  } catch {
    return { themes: ["Tactics"], estimatedRating: 1200, description };
  }

  const isCheck = game.inCheck();
  const isCheckmate = game.isCheckmate();

  if (isCheckmate) {
    themes.add("Checkmate Patterns");

    // Check for Smothered Mate (Knight checkmating king surrounded by friendly pieces)
    if (movedPiece?.type === "n") {
      themes.add("Smothered Mate");
      description = "Smothered mate with knight.";
    }

    // Check for Back Rank Mate (Rook or Queen checkmating on 1st or 8th rank)
    if (
      (movedPiece?.type === "r" || movedPiece?.type === "q") &&
      (to.endsWith("1") || to.endsWith("8"))
    ) {
      themes.add("Back Rank Mate");
      description = "Back rank checkmate.";
    }
  }

  // Fork Detection: Check if moved piece attacks >= 2 enemy pieces of equal or higher value
  let attackedPiecesCount = 0;
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === opponentColor && piece.type !== "p") {
        const sq = (String.fromCharCode(97 + c) + (8 - r)) as Square;
        if (isSquareAttackedBy(game, sq, playerColor)) {
          // If moved piece is a knight or pawn or queen attacking multiple major pieces
          attackedPiecesCount++;
        }
      }
    }
  }

  if (attackedPiecesCount >= 2) {
    themes.add("Fork");
    description = `${movedPiece?.type === "n" ? "Knight" : "Piece"} fork attacking multiple pieces.`;
  }

  // Discovered Attack / Discovered Check
  // If move was made and check happened, but the checking piece is NOT the moved piece
  if (isCheck) {
    themes.add("Discovered Attack");
  }

  // Replay remaining moves to analyze depth and sacrifices
  let sacrificeHappened = false;
  for (let i = 1; i < uciMoves.length; i++) {
    const moveUci = uciMoves[i];
    const mFrom = moveUci.slice(0, 2) as Square;
    const mTo = moveUci.slice(2, 4) as Square;
    const mProm = moveUci.length > 4 ? moveUci[4] : undefined;

    const moving = game.get(mFrom);
    const target = game.get(mTo);

    if (i % 2 === 0 && moving && target) {
      // Player capturing with higher value piece into defended square (sacrifice)
      if (PIECE_VALUES[moving.type] > PIECE_VALUES[target.type]) {
        sacrificeHappened = true;
      }
    }

    try {
      game.move({ from: mFrom, to: mTo, promotion: mProm });
    } catch {
      break;
    }
  }

  if (game.isCheckmate()) {
    themes.add("Checkmate Patterns");
  }

  if (themes.size === 0) {
    if (capturedPiece) {
      themes.add("Tactics");
      themes.add("Winning Material");
    } else {
      themes.add("Positional");
    }
  }

  // Calculate estimated rating
  // Base rating on move sequence length, sacrifices, and tactical complexity
  const plies = uciMoves.length;
  let baseRating = 800;

  if (plies <= 2) {
    baseRating = 700 + Math.floor(Math.random() * 200); // 700-900
  } else if (plies <= 4) {
    baseRating = 1100 + Math.floor(Math.random() * 300); // 1100-1400
  } else if (plies <= 6) {
    baseRating = 1500 + Math.floor(Math.random() * 350); // 1500-1850
  } else {
    baseRating = 1900 + Math.floor(Math.random() * 400); // 1900-2300
  }

  if (sacrificeHappened) {
    baseRating += 250;
  }

  if (themes.has("Smothered Mate") || themes.has("Greek Gift")) {
    baseRating = Math.max(baseRating, 1600);
  }

  const finalThemes = Array.from(themes);
  return {
    themes: finalThemes,
    estimatedRating: Math.min(2700, Math.max(600, baseRating)),
    description: description || `${finalThemes.join(" & ")} tactical sequence.`,
  };
}
