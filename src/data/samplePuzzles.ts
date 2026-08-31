export interface Puzzle {
  id: string;
  fen: string;
  moves: string[]; // UCI format sequence e.g. ["e2e4", "e7e5"]
  rating: number;
  themes: string[];
  description: string;
  gameUrl?: string;
}

export const samplePuzzles: Puzzle[] = [
  // ==========================================
  // --- FORKS (Beginner to Advanced) ---
  // ==========================================
  {
    id: "fork-beginner-1",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR b KQkq - 3 3",
    moves: ["g8f6", "f3b3", "c6d4"],
    rating: 750,
    themes: ["Fork", "Beginner", "Opening"],
    description: "Black forks the queen and c2 square with knight jump.",
  },
  {
    id: "fork-novice-2",
    fen: "r1b1k2r/pppp1ppp/2n5/4p3/2B1n2q/5N2/PPPP1PPP/RNBQ1RK1 b kq - 1 6",
    moves: ["h4f2", "f1f2", "e4f2"],
    rating: 950,
    themes: ["Fork", "Novice"],
    description: "Tactical deflection leading to a royal fork.",
  },
  {
    id: "fork-intermediate-3",
    fen: "r1b2rk1/pp3ppp/2n1pn2/2q5/2B5/1PN1PN2/P4PPP/R2Q1RK1 w - - 0 12",
    moves: ["c3a4", "c5e7", "a4b6"],
    rating: 1350,
    themes: ["Fork", "Intermediate"],
    description: "Knight outpost fork on the queenside.",
  },
  {
    id: "fork-advanced-4",
    fen: "2r2rk1/1b3ppp/pp2p3/3pP3/Pq1N1P2/1P1Q4/2P3PP/R4RK1 w - - 1 19",
    moves: ["d4e6", "f7e6", "d3h7"],
    rating: 1850,
    themes: ["Fork", "Advanced", "Sacrifice"],
    description: "Central knight sacrifice opening double attack paths.",
  },

  // ==========================================
  // --- PINS (Beginner to Advanced) ---
  // ==========================================
  {
    id: "pin-beginner-1",
    fen: "r1b1k1nr/pppp1ppp/2n5/4p3/1b2P3/2N2N2/PPPP1PPP/R1B1KB1R w KQkq - 2 4",
    moves: ["c3d5", "b4a5", "b2b4"],
    rating: 800,
    themes: ["Pin", "Beginner"],
    description: "Exploiting the pin on the c3 knight.",
  },
  {
    id: "pin-novice-2",
    fen: "r2qk2r/ppp1bppp/2n1bn2/3p4/3P4/2NBPN2/PP3PPP/R1BQK2R w KQkq - 4 8",
    moves: ["d3b5", "e8g8", "b5c6"],
    rating: 1050,
    themes: ["Pin", "Novice"],
    description: "Pinning the c6 knight to damage Black's pawn structure.",
  },
  {
    id: "pin-intermediate-3",
    fen: "3r2k1/pp3ppp/2p5/4q3/2P5/1P2P2P/P1Q2PP1/3R2K1 b - - 1 20",
    moves: ["d8d1", "c2d1", "e5e8"],
    rating: 1450,
    themes: ["Pin", "Back Rank Mate", "Intermediate"],
    description: "Pinning the major piece down the open d-file.",
  },

  // ==========================================
  // --- SKEWERS ---
  // ==========================================
  {
    id: "skewer-beginner-1",
    fen: "8/8/8/4k1r1/8/8/8/R3K3 w - - 0 1",
    moves: ["a1a5", "e5f6", "a5g5"],
    rating: 750,
    themes: ["Skewer", "Beginner", "Endgame"],
    description: "Rook skewer checking the king and winning the rook on g5.",
  },
  {
    id: "skewer-intermediate-2",
    fen: "r1b1k2r/pp3ppp/4p3/3q4/1b1P4/5N2/PP1B1PPP/R2QK2R b KQkq - 2 11",
    moves: ["b4d2", "d1d2", "d5e4"],
    rating: 1300,
    themes: ["Skewer", "Intermediate"],
    description: "Central queen skewer targeting king and loose kingside pieces.",
  },
  {
    id: "skewer-advanced-3",
    fen: "8/1r6/4k3/2B5/1P1K4/8/8/R7 w - - 5 50",
    moves: ["a1a6", "e6f7", "a6b6"],
    rating: 1950,
    themes: ["Skewer", "Advanced", "Endgame"],
    description: "Precision endgame rook skewer forcing simplification.",
  },

  // ==========================================
  // --- DISCOVERED ATTACKS ---
  // ==========================================
  {
    id: "discovered-novice-1",
    fen: "r1bqkb1r/pppp1ppp/2n5/4P3/2B1n3/5N2/PPP2PPP/RNBQK2R w KQkq - 0 6",
    moves: ["c4f7", "e8f7", "d1d5"],
    rating: 1100,
    themes: ["Discovered Attack", "Novice"],
    description: "Bishop sacrifice on f7 revealing a queen fork on d5.",
  },
  {
    id: "discovered-intermediate-2",
    fen: "r1b2rk1/pp1nqppp/2p5/4N3/3PB3/8/PP3PPP/R2Q1RK1 w - - 1 14",
    moves: ["e4h7", "g8h7", "d1h5"],
    rating: 1550,
    themes: ["Discovered Attack", "Greek Gift", "Intermediate"],
    description: "Discovered attack leading into standard Greek Gift kingside assault.",
  },
  {
    id: "discovered-elite-3",
    fen: "r2qr1k1/pb1nbppp/1p2p3/2ppP1N1/3P1P2/2PB4/PP1N2PP/R2Q1RK1 w - - 0 13",
    moves: ["d3h7", "g8f8", "d1h5"],
    rating: 2250,
    themes: ["Discovered Attack", "Elite", "Attacking King"],
    description: "Master level discovered kingside storm breaching Black's fortress.",
  },

  // ==========================================
  // --- CHECKMATE PATTERNS & MATES ---
  // ==========================================
  {
    id: "mate-scholars",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    moves: ["h5f7"],
    rating: 600,
    themes: ["Checkmate Patterns", "Beginner", "Mate in 1"],
    description: "Classic Scholar's Mate on f7.",
  },
  {
    id: "mate-backrank-1",
    fen: "6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1",
    moves: ["b1b8"],
    rating: 700,
    themes: ["Back Rank Mate", "Checkmate Patterns", "Beginner"],
    description: "Direct back rank mate against trapped king.",
  },
  {
    id: "mate-backrank-2",
    fen: "3r2k1/p4ppp/1p6/8/8/1P2P3/P1R2PPP/6K1 w - - 0 1",
    moves: ["c2c8", "d8c8"],
    rating: 900,
    themes: ["Back Rank Mate", "Novice"],
    description: "Deflection to force back rank mate.",
  },
  {
    id: "mate-smothered-1",
    fen: "r5rk/5Nbp/8/8/8/8/8/7K w - - 0 1",
    moves: ["f7h6"],
    rating: 1200,
    themes: ["Smothered Mate", "Checkmate Patterns", "Intermediate"],
    description: "Classic Smothered Mate pattern delivered by knight.",
  },
  {
    id: "mate-anastasia",
    fen: "5rk1/1p3ppp/8/2N5/8/7P/P4PP1/R2R2K1 w - - 0 1",
    moves: ["c5d7", "f8e8", "d1e1"],
    rating: 1400,
    themes: ["Checkmate Patterns", "Anastasia's Mate", "Intermediate"],
    description: "Anastasia's mate coordination between knight and rook.",
  },

  // ==========================================
  // --- DEFLECTIONS & DOUBLE CHECKS ---
  // ==========================================
  {
    id: "deflect-inter-1",
    fen: "r4rk1/pb3ppp/1p6/2b1q3/3p4/1P2P1P1/PB1Q1P1P/R4RK1 w - - 0 18",
    moves: ["e3d4", "e5d5", "f2f3"],
    rating: 1500,
    themes: ["Deflection", "Intermediate"],
    description: "Deflecting the central queen from the long diagonal mate threat.",
  },
  {
    id: "double-check-adv-1",
    fen: "r1b2rk1/pp1n1p1p/2p3p1/3pP3/1b1P4/2N3q1/PPPB1RP1/R2QKBN1 w Q - 2 13",
    moves: ["d1f3", "g3f3", "g1f3"],
    rating: 1750,
    themes: ["Double Check", "Advanced"],
    description: "Double check threat neutralizing opponent's queen infiltration.",
  },

  // ==========================================
  // --- ELITE & GRANDMASTER PUZZLES ---
  // ==========================================
  {
    id: "elite-greek-gift",
    fen: "2r3k1/1p1n1ppp/1q1bp3/3p4/p2P1P2/P2BP3/1P1BQ1PP/5RK1 w - - 0 19",
    moves: ["d3h7", "g8h7", "e2h5", "h7g8"],
    rating: 2350,
    themes: ["Elite", "Greek Gift", "Checkmate Patterns"],
    description: "Grandmaster Greek Gift bishop sacrifice dismantling kingside shelter.",
  },
  {
    id: "elite-endgame-zugzwang",
    fen: "8/8/1p6/1P6/8/2K5/8/1k6 w - - 1 1",
    moves: ["c3b3", "b1c1", "b3c3"],
    rating: 2450,
    themes: ["Elite", "Endgame", "Zugzwang"],
    description: "Deep king triangulation forcing opponent king away in endgame.",
  },
];

export const THEMES = [
  "All Themes",
  "Fork",
  "Pin",
  "Skewer",
  "Discovered Attack",
  "Checkmate Patterns",
  "Back Rank Mate",
  "Smothered Mate",
  "Greek Gift",
  "Deflection",
  "Double Check",
  "Endgame",
  "Opening",
];

export const RATINGS = [
  { label: "All Ratings", min: 0, max: 3000 },
  { label: "Beginner (0-800)", min: 0, max: 800 },
  { label: "Novice (800-1200)", min: 800, max: 1200 },
  { label: "Intermediate (1200-1800)", min: 1200, max: 1800 },
  { label: "Advanced (1800-2200)", min: 1800, max: 2200 },
  { label: "Elite (2200+)", min: 2200, max: 3000 },
];
