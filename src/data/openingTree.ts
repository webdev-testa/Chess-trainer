import type { ExplorerMove, ExplorerGame } from "../hooks/useLichessExplorer";

export interface StaticTreePosition {
  openingName: string;
  eco: string;
  moves: ExplorerMove[];
  topGames: ExplorerGame[];
}

// Normalized FEN key generator (first 4 segments of FEN: pieces, turn, castling, en-passant)
export function getFenKey(fen: string): string {
  const parts = fen.trim().split(" ");
  return parts.slice(0, 4).join(" ");
}

export const CURATED_OPENING_TREE: Record<string, StaticTreePosition> = {
  // ==========================================
  // STARTING POSITION
  // ==========================================
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -": {
    openingName: "Starting Position",
    eco: "A00",
    moves: [
      { san: "e4", uci: "e2e4", white: 154200, draws: 112400, black: 104500, averageRating: 2540, totalGames: 371100, whiteWinPct: 42, drawPct: 30, blackWinPct: 28 },
      { san: "d4", uci: "d2d4", white: 148100, draws: 125300, black: 91400, averageRating: 2555, totalGames: 364800, whiteWinPct: 41, drawPct: 34, blackWinPct: 25 },
      { san: "Nf3", uci: "g1f3", white: 41200, draws: 38900, black: 24100, averageRating: 2530, totalGames: 104200, whiteWinPct: 40, drawPct: 37, blackWinPct: 23 },
      { san: "c4", uci: "c2c4", white: 36800, draws: 32400, black: 21200, averageRating: 2535, totalGames: 90400, whiteWinPct: 41, drawPct: 36, blackWinPct: 23 },
      { san: "g3", uci: "g2g3", white: 4800, draws: 4200, black: 2800, averageRating: 2505, totalGames: 11800, whiteWinPct: 41, drawPct: 35, blackWinPct: 24 },
      { san: "b3", uci: "b2b3", white: 2900, draws: 2400, black: 1900, averageRating: 2490, totalGames: 7200, whiteWinPct: 40, drawPct: 34, blackWinPct: 26 },
    ],
    topGames: [
      { id: "1", white: { name: "Carlsen, M.", rating: 2882 }, black: { name: "Nakamura, H.", rating: 2780 }, year: 2023, winner: "white" },
      { id: "2", white: { name: "Kasparov, G.", rating: 2851 }, black: { name: "Anand, V.", rating: 2795 }, year: 1995, winner: "draw" },
    ],
  },

  // ==========================================
  // 1. e4 (KING'S PAWN)
  // ==========================================
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3": {
    openingName: "King's Pawn Game",
    eco: "B00",
    moves: [
      { san: "c5", uci: "c7c5", white: 58200, draws: 47900, black: 44100, averageRating: 2550, totalGames: 150200, whiteWinPct: 39, drawPct: 32, blackWinPct: 29 },
      { san: "e5", uci: "e7e5", white: 46200, draws: 42100, black: 29500, averageRating: 2540, totalGames: 117800, whiteWinPct: 39, drawPct: 36, blackWinPct: 25 },
      { san: "c6", uci: "c7c6", white: 24500, draws: 29800, black: 18200, averageRating: 2545, totalGames: 72500, whiteWinPct: 34, drawPct: 41, blackWinPct: 25 },
      { san: "e6", uci: "e7e6", white: 22100, draws: 19400, black: 15800, averageRating: 2525, totalGames: 57300, whiteWinPct: 39, drawPct: 34, blackWinPct: 27 },
      { san: "d6", uci: "d7d6", white: 5800, draws: 4600, black: 3800, averageRating: 2515, totalGames: 14200, whiteWinPct: 41, drawPct: 32, blackWinPct: 27 },
      { san: "d5", uci: "d7d5", white: 4200, draws: 3600, black: 2900, averageRating: 2500, totalGames: 10700, whiteWinPct: 39, drawPct: 34, blackWinPct: 27 },
      { san: "Nf6", uci: "g8f6", white: 3100, draws: 2400, black: 2100, averageRating: 2490, totalGames: 7600, whiteWinPct: 41, drawPct: 31, blackWinPct: 28 },
    ],
    topGames: [
      { id: "3", white: { name: "Fischer, B.", rating: 2785 }, black: { name: "Petrosian, T.", rating: 2640 }, year: 1971, winner: "black" },
      { id: "4", white: { name: "Kasparov, G.", rating: 2812 }, black: { name: "Anand, V.", rating: 2775 }, year: 1995, winner: "white" },
    ],
  },

  // 1. e4 c5 (Sicilian Defense)
  "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6": {
    openingName: "Sicilian Defense",
    eco: "B20",
    moves: [
      { san: "Nf3", uci: "g1f3", white: 44200, draws: 36400, black: 32800, averageRating: 2565, totalGames: 113400, whiteWinPct: 39, drawPct: 32, blackWinPct: 29 },
      { san: "Nc3", uci: "b1c3", white: 6200, draws: 5100, black: 4400, averageRating: 2525, totalGames: 15700, whiteWinPct: 39, drawPct: 33, blackWinPct: 28 },
      { san: "c3", uci: "c2c3", white: 4100, draws: 3900, black: 2800, averageRating: 2520, totalGames: 10800, whiteWinPct: 38, drawPct: 36, blackWinPct: 26 },
      { san: "d4", uci: "d2d4", white: 1800, draws: 1200, black: 1400, averageRating: 2510, totalGames: 4400, whiteWinPct: 41, drawPct: 27, blackWinPct: 32 },
    ],
    topGames: [
      { id: "5", white: { name: "Carlsen, M.", rating: 2882 }, black: { name: "Caruana, F.", rating: 2835 }, year: 2018, winner: "draw" },
    ],
  },

  // 1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 (Sicilian Najdorf)
  "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq -": {
    openingName: "Sicilian Defense: Najdorf Variation",
    eco: "B90",
    moves: [
      { san: "Be3", uci: "c1e3", white: 6800, draws: 5400, black: 4800, averageRating: 2580, totalGames: 17000, whiteWinPct: 40, drawPct: 32, blackWinPct: 28 },
      { san: "Bg5", uci: "c1g5", white: 5400, draws: 4200, black: 3800, averageRating: 2575, totalGames: 13400, whiteWinPct: 40, drawPct: 31, blackWinPct: 29 },
      { san: "Be2", uci: "f1e2", white: 4100, draws: 4200, black: 2900, averageRating: 2565, totalGames: 11200, whiteWinPct: 37, drawPct: 37, blackWinPct: 26 },
      { san: "h3", uci: "h2h3", white: 2400, draws: 1900, black: 1600, averageRating: 2560, totalGames: 5900, whiteWinPct: 41, drawPct: 32, blackWinPct: 27 },
      { san: "f3", uci: "f2f3", white: 1800, draws: 1400, black: 1200, averageRating: 2550, totalGames: 4400, whiteWinPct: 41, drawPct: 32, blackWinPct: 27 },
    ],
    topGames: [
      { id: "6", white: { name: "Kasparov, G.", rating: 2851 }, black: { name: "Topalov, V.", rating: 2700 }, year: 1999, winner: "white" },
    ],
  },

  // 1. e4 e5 (Open Game)
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6": {
    openingName: "Open Game (King's Pawn)",
    eco: "C20",
    moves: [
      { san: "Nf3", uci: "g1f3", white: 38900, draws: 36200, black: 24100, averageRating: 2555, totalGames: 99200, whiteWinPct: 39, drawPct: 37, blackWinPct: 24 },
      { san: "Nc3", uci: "b1c3", white: 3100, draws: 2800, black: 2100, averageRating: 2510, totalGames: 8000, whiteWinPct: 39, drawPct: 35, blackWinPct: 26 },
      { san: "Bc4", uci: "f1c4", white: 2400, draws: 2100, black: 1700, averageRating: 2505, totalGames: 6200, whiteWinPct: 39, drawPct: 34, blackWinPct: 27 },
      { san: "f4", uci: "f2f4", white: 1200, draws: 750, black: 950, averageRating: 2500, totalGames: 2900, whiteWinPct: 41, drawPct: 26, blackWinPct: 33 },
    ],
    topGames: [
      { id: "7", white: { name: "Morphy, P.", rating: 2690 }, black: { name: "Duke of Brunswick", rating: 2400 }, year: 1858, winner: "white" },
    ],
  },

  // 1. e4 e5 2. Nf3 Nc6 (Italian / Ruy Lopez setup)
  "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq -": {
    openingName: "Open Game: 2...Nc6",
    eco: "C44",
    moves: [
      { san: "Bb5", uci: "f1b5", white: 24200, draws: 24800, black: 14600, averageRating: 2570, totalGames: 63600, whiteWinPct: 38, drawPct: 39, blackWinPct: 23 },
      { san: "Bc4", uci: "f1c4", white: 11400, draws: 9800, black: 7200, averageRating: 2540, totalGames: 28400, whiteWinPct: 40, drawPct: 35, blackWinPct: 25 },
      { san: "d4", uci: "d2d4", white: 2900, draws: 2400, black: 1800, averageRating: 2520, totalGames: 7100, whiteWinPct: 41, drawPct: 34, blackWinPct: 25 },
      { san: "Nc3", uci: "b1c3", white: 1800, draws: 1700, black: 1100, averageRating: 2515, totalGames: 4600, whiteWinPct: 39, drawPct: 37, blackWinPct: 24 },
    ],
    topGames: [
      { id: "8", white: { name: "Kasparov, G.", rating: 2820 }, black: { name: "Karpov, A.", rating: 2770 }, year: 1990, winner: "white" },
    ],
  },

  // 1. e4 e6 (French Defense)
  "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -": {
    openingName: "French Defense",
    eco: "C00",
    moves: [
      { san: "d4", uci: "d2d4", white: 19800, draws: 17800, black: 14200, averageRating: 2545, totalGames: 51800, whiteWinPct: 38, drawPct: 35, blackWinPct: 27 },
      { san: "d3", uci: "d2d3", white: 1400, draws: 1200, black: 900, averageRating: 2510, totalGames: 3500, whiteWinPct: 40, drawPct: 34, blackWinPct: 26 },
      { san: "Nf3", uci: "g1f3", white: 800, draws: 700, black: 500, averageRating: 2500, totalGames: 2000, whiteWinPct: 40, drawPct: 35, blackWinPct: 25 },
    ],
    topGames: [
      { id: "9", white: { name: "Botvinnik, M.", rating: 2720 }, black: { name: "Smyslov, V.", rating: 2710 }, year: 1954, winner: "draw" },
    ],
  },

  // 1. e4 c6 (Caro-Kann Defense)
  "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -": {
    openingName: "Caro-Kann Defense",
    eco: "B10",
    moves: [
      { san: "d4", uci: "d2d4", white: 21200, draws: 26500, black: 15800, averageRating: 2550, totalGames: 63500, whiteWinPct: 33, drawPct: 42, blackWinPct: 25 },
      { san: "Nc3", uci: "b1c3", white: 4100, draws: 4800, black: 2900, averageRating: 2520, totalGames: 11800, whiteWinPct: 35, drawPct: 41, blackWinPct: 24 },
      { san: "Nf3", uci: "g1f3", white: 2100, draws: 2400, black: 1500, averageRating: 2510, totalGames: 6000, whiteWinPct: 35, drawPct: 40, blackWinPct: 25 },
      { san: "c4", uci: "c2c4", white: 1800, draws: 1900, black: 1200, averageRating: 2515, totalGames: 4900, whiteWinPct: 37, drawPct: 39, blackWinPct: 24 },
    ],
    topGames: [
      { id: "10", white: { name: "Kasparov, G.", rating: 2800 }, black: { name: "Karpov, A.", rating: 2750 }, year: 1987, winner: "draw" },
    ],
  },

  // ==========================================
  // 1. d4 (QUEEN'S PAWN & CLOSED GAMES)
  // ==========================================
  "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3": {
    openingName: "Queen's Pawn Game",
    eco: "A40",
    moves: [
      { san: "d5", uci: "d7d5", white: 64200, draws: 58900, black: 38400, averageRating: 2560, totalGames: 161500, whiteWinPct: 40, drawPct: 36, blackWinPct: 24 },
      { san: "Nf6", uci: "g8f6", white: 62100, draws: 55400, black: 39800, averageRating: 2565, totalGames: 157300, whiteWinPct: 39, drawPct: 35, blackWinPct: 26 },
      { san: "e6", uci: "e7e6", white: 11200, draws: 9800, black: 6400, averageRating: 2530, totalGames: 27400, whiteWinPct: 41, drawPct: 36, blackWinPct: 23 },
      { san: "f5", uci: "f7f5", white: 5800, draws: 4200, black: 3600, averageRating: 2510, totalGames: 13600, whiteWinPct: 43, drawPct: 31, blackWinPct: 26 },
      { san: "g6", uci: "g7g6", white: 4100, draws: 3200, black: 2500, averageRating: 2505, totalGames: 9800, whiteWinPct: 42, drawPct: 33, blackWinPct: 25 },
    ],
    topGames: [
      { id: "11", white: { name: "Carlsen, M.", rating: 2882 }, black: { name: "Caruana, F.", rating: 2835 }, year: 2018, winner: "draw" },
    ],
  },

  // 1. d4 d5 2. c4 (Queen's Gambit)
  "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3": {
    openingName: "Queen's Gambit",
    eco: "D06",
    moves: [
      { san: "e6", uci: "e7e6", white: 26400, draws: 29800, black: 15200, averageRating: 2570, totalGames: 71400, whiteWinPct: 37, drawPct: 42, blackWinPct: 21 },
      { san: "c6", uci: "c7c6", white: 19800, draws: 22400, black: 12100, averageRating: 2565, totalGames: 54300, whiteWinPct: 36, drawPct: 41, blackWinPct: 23 },
      { san: "dxc4", uci: "d5c4", white: 9400, draws: 8600, black: 5100, averageRating: 2540, totalGames: 23100, whiteWinPct: 41, drawPct: 37, blackWinPct: 22 },
      { san: "e5", uci: "e7e5", white: 1200, draws: 850, black: 750, averageRating: 2500, totalGames: 2800, whiteWinPct: 43, drawPct: 30, blackWinPct: 27 },
    ],
    topGames: [
      { id: "12", white: { name: "Kasparov, G.", rating: 2812 }, black: { name: "Kramnik, V.", rating: 2770 }, year: 2000, winner: "black" },
    ],
  },

  // 1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 (King's Indian / Grünfeld setup)
  "rnbqk2r/ppppppbp/5np1/8/2PPP3/2N5/PP3PPP/R1BQKBNR b KQkq -": {
    openingName: "King's Indian Defense",
    eco: "E60",
    moves: [
      { san: "d6", uci: "d7d6", white: 14200, draws: 11400, black: 10800, averageRating: 2575, totalGames: 36400, whiteWinPct: 39, drawPct: 31, blackWinPct: 30 },
      { san: "O-O", uci: "e8g8", white: 8400, draws: 6900, black: 5800, averageRating: 2565, totalGames: 21100, whiteWinPct: 40, drawPct: 33, blackWinPct: 27 },
    ],
    topGames: [
      { id: "13", white: { name: "Kramnik, V.", rating: 2790 }, black: { name: "Kasparov, G.", rating: 2840 }, year: 1999, winner: "draw" },
    ],
  },

  // ==========================================
  // FLANK OPENINGS (1. c4 & 1. Nf3)
  // ==========================================
  "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq c3": {
    openingName: "English Opening",
    eco: "A10",
    moves: [
      { san: "e5", uci: "e7e5", white: 14800, draws: 13900, black: 9800, averageRating: 2555, totalGames: 38500, whiteWinPct: 38, drawPct: 36, blackWinPct: 26 },
      { san: "Nf6", uci: "g8f6", white: 14200, draws: 13400, black: 8600, averageRating: 2550, totalGames: 36200, whiteWinPct: 39, drawPct: 37, blackWinPct: 24 },
      { san: "c5", uci: "c7c5", white: 6400, draws: 6800, black: 3800, averageRating: 2540, totalGames: 17000, whiteWinPct: 38, drawPct: 40, blackWinPct: 22 },
      { san: "e6", uci: "e7e6", white: 5800, draws: 5200, black: 3200, averageRating: 2530, totalGames: 14200, whiteWinPct: 41, drawPct: 37, blackWinPct: 22 },
    ],
    topGames: [
      { id: "14", white: { name: "Botvinnik, M.", rating: 2730 }, black: { name: "Portisch, L.", rating: 2650 }, year: 1968, winner: "white" },
    ],
  },

  "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq -": {
    openingName: "Réti Opening",
    eco: "A04",
    moves: [
      { san: "d5", uci: "d7d5", white: 18200, draws: 17400, black: 10800, averageRating: 2550, totalGames: 46400, whiteWinPct: 39, drawPct: 38, blackWinPct: 23 },
      { san: "Nf6", uci: "g8f6", white: 16400, draws: 15900, black: 9900, averageRating: 2545, totalGames: 42200, whiteWinPct: 39, drawPct: 38, blackWinPct: 23 },
      { san: "c5", uci: "c7c5", white: 6200, draws: 5800, black: 3800, averageRating: 2535, totalGames: 15800, whiteWinPct: 39, drawPct: 37, blackWinPct: 24 },
      { san: "g6", uci: "g7g6", white: 3400, draws: 2900, black: 2100, averageRating: 2520, totalGames: 8400, whiteWinPct: 40, drawPct: 35, blackWinPct: 25 },
    ],
    topGames: [
      { id: "15", white: { name: "Réti, R.", rating: 2650 }, black: { name: "Capablanca, J.", rating: 2760 }, year: 1924, winner: "white" },
    ],
  },
};
