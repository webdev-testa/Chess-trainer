export interface Puzzle {
    id: string;
    fen: string;
    moves: string[]; // UCI format sequence
    rating: number;
    themes: string[];
    description: string;
}

export const samplePuzzles: Puzzle[] = [
    // --- FORKS ---
    {
        id: "fork-1",
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR b KQkq - 3 3",
        moves: ["c6d4", "f3d3", "d4c2"], // Not a real puzzle, just placeholder logic for fork structure check
        rating: 800,
        themes: ["Fork", "Beginner"],
        description: "Knight fork on c2 winning the rook."
    },
    {
        id: "fork-2",
        fen: "8/8/4k3/8/8/2N5/1P3P2/4K3 w - - 0 1",
        moves: ["f2f4", "e6f5", "c3d5"], // Placeholder
        rating: 1200,
        themes: ["Fork", "Novice"],
        description: "Simple knight fork in endgame."
    },

    // --- PINS ---
    {
        id: "pin-1",
        fen: "r1b1k1nr/pppp1ppp/2n5/4p3/1b2P3/2N2N2/PPPP1PPP/R1B1KB1R w KQkq - 2 4",
        moves: ["c3d5", "b4a5", "b2b4"],
        rating: 900,
        themes: ["Pin", "Beginner"],
        description: "Exploiting the pin on the d-file."
    },

    // --- MATES ---
    {
        id: "mate-1",
        fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
        moves: ["h5f7"],
        rating: 600,
        themes: ["Checkmate Patterns", "Beginner", "Scholar's Mate"],
        description: "Classic Scholar's Mate."
    },
    {
        id: "mate-2-backrank",
        fen: "6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1",
        moves: ["b1b8"],
        rating: 800,
        themes: ["Checkmate Patterns", "Back Rank Mate", "Beginner"],
        description: "Back rank checkmate."
    },
    {
        id: "mate-3-smothered",
        fen: "r5rk/5Nbp/8/8/8/8/8/7K w - - 0 1",
        moves: ["f7h6"],
        rating: 1500,
        themes: ["Checkmate Patterns", "Smothered Mate", "Intermediate"],
        description: "Classic Smothered Mate pattern."
    },

    // --- TACTICS ---
    {
        id: "skewer-1",
        fen: "8/8/8/3k4/8/8/3R4/3K4 w - - 0 1",
        moves: ["d2d8"], // Placeholder logic
        rating: 1000,
        themes: ["Skewer", "Novice"],
        description: "Rook skewer."
    },
    {
        id: "discovered-1",
        fen: "rnbqkbnr/ppp2ppp/8/3p4/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 1",
        moves: ["d1e2"], // Placeholder
        rating: 1100,
        themes: ["Discovered Attack", "Novice"],
        description: "Simple discovered check."
    },

    // --- ADVANCED ---
    {
        id: "adv-1",
        fen: "r2q1rk1/ppp2ppp/2n5/3p4/3Pn1b1/2P2N2/P1P1BPPP/R1BQ1RK1 w - - 1 10",
        moves: ["c3c4", "e4c3", "d1e1", "c3e2"],
        rating: 1900,
        themes: ["Advanced", "Evaluation"],
        description: "Complex exchange in the center."
    },
    {
        id: "elite-1",
        fen: "r1b2rk1/ppqn1pbp/2pp1np1/4p3/2PPP3/2N1BP2/PP1QN1PP/R3KB1R w KQ - 4 9",
        moves: ["d4d5", "c6b4", "a2a3"],
        rating: 2300,
        themes: ["Elite", "Positional"],
        description: "Grandmaster level positional squeeze."
    }
];

export const THEMES = [
    "All Themes",
    "Fork",
    "Pin",
    "Skewer",
    "Discovered Attack",
    "Checkmate Patterns",
    "Back Rank Mate",
    "Smothered Mate"
];

export const RATINGS = [
    { label: "All Ratings", min: 0, max: 3000 },
    { label: "Beginner (0-800)", min: 0, max: 800 },
    { label: "Novice (800-1200)", min: 800, max: 1200 },
    { label: "Intermediate (1200-1800)", min: 1200, max: 1800 },
    { label: "Advanced (1800-2200)", min: 1800, max: 2200 },
    { label: "Elite (2200+)", min: 2200, max: 3000 }
];
