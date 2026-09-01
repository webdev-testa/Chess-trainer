import { useState, useEffect, useCallback } from "react";
import { samplePuzzles, RATINGS } from "../data/samplePuzzles";
import type { Puzzle } from "../data/samplePuzzles";
import { parseUniversalPuzzleFile } from "../utils/puzzleParser";
import { classifyPuzzle } from "../utils/puzzleClassifier";
import { Chess } from "chess.js";

export type PuzzleSource = "online" | "daily" | "offline" | "imported";

export interface PuzzleStats {
  solved: number;
  failed: number;
  streak: number;
  bestStreak: number;
}

const STATS_KEY = "chess_trainer_puzzle_stats";
const IMPORTED_KEY = "chess_trainer_imported_puzzles";
const DB_NAME = "ChessTrainerPuzzlesDB";
const STORE_NAME = "puzzles_store";

async function savePuzzlesToStorage(puzzles: Puzzle[]): Promise<void> {
  try {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    req.onsuccess = () => {
      const tx = req.result.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      puzzles.forEach((p) => store.put(p));
    };
  } catch {
    localStorage.setItem(IMPORTED_KEY, JSON.stringify(puzzles.slice(0, 500)));
  }
}

async function loadPuzzlesFromStorage(): Promise<Puzzle[]> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      req.onsuccess = () => {
        const getAll = req.result.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
        getAll.onsuccess = () => resolve(getAll.result || []);
        getAll.onerror = () => resolve([]);
      };
      req.onerror = () => {
        const local = localStorage.getItem(IMPORTED_KEY);
        resolve(local ? JSON.parse(local) : []);
      };
    } catch {
      const local = localStorage.getItem(IMPORTED_KEY);
      resolve(local ? JSON.parse(local) : []);
    }
  });
}

export function usePuzzleDatabase() {
  // Default is "online"
  const [source, setSource] = useState<PuzzleSource>("online");
  const [importedPuzzles, setImportedPuzzles] = useState<Puzzle[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [stats, setStats] = useState<PuzzleStats>(() => {
    try {
      const stored = localStorage.getItem(STATS_KEY);
      return stored
        ? JSON.parse(stored)
        : { solved: 0, failed: 0, streak: 0, bestStreak: 0 };
    } catch {
      return { solved: 0, failed: 0, streak: 0, bestStreak: 0 };
    }
  });

  // Load imported puzzles on mount
  useEffect(() => {
    loadPuzzlesFromStorage().then((puzzles) => {
      if (puzzles && puzzles.length > 0) {
        setImportedPuzzles(puzzles);
      }
    });
  }, []);

  // Save stats
  const recordSolved = useCallback(() => {
    setStats((prev) => {
      const newStreak = prev.streak + 1;
      const updated: PuzzleStats = {
        solved: prev.solved + 1,
        failed: prev.failed,
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
      };
      localStorage.setItem(STATS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const recordFailed = useCallback(() => {
    setStats((prev) => {
      const updated: PuzzleStats = {
        solved: prev.solved,
        failed: prev.failed + 1,
        streak: 0,
        bestStreak: prev.bestStreak,
      };
      localStorage.setItem(STATS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Import custom file
  const importFile = useCallback(async (file: File): Promise<number> => {
    setIsImporting(true);
    try {
      const text = await file.text();
      const parsed = parseUniversalPuzzleFile(text, 10000);
      if (parsed.length > 0) {
        await savePuzzlesToStorage(parsed);
        setImportedPuzzles(parsed);
        setSource("imported");
      }
      setIsImporting(false);
      return parsed.length;
    } catch (err) {
      setIsImporting(false);
      throw err;
    }
  }, []);

  // Fetch puzzle from active source with automatic offline fallback to curated
  const fetchPuzzle = useCallback(
    async (
      activeSource: PuzzleSource,
      theme: string,
      ratingLabel: string
    ): Promise<Puzzle | null> => {
      const ratingRange =
        RATINGS.find((r) => r.label === ratingLabel) || RATINGS[0];

      // 1. DAILY PUZZLE MODE
      if (activeSource === "daily") {
        try {
          const res = await fetch("https://lichess.org/api/puzzle/daily");
          if (!res.ok) throw new Error("Daily puzzle request failed");
          const data = await res.json();

          const tempGame = new Chess();
          tempGame.loadPgn(data.game.pgn);
          const history = tempGame.history({ verbose: true });

          const startParams = new Chess();
          for (let i = 0; i <= data.puzzle.initialPly && i < history.length; i++) {
            startParams.move(history[i]);
          }

          return {
            id: data.puzzle.id,
            fen: startParams.fen(),
            moves: data.puzzle.solution,
            rating: data.puzzle.rating,
            themes: data.puzzle.themes,
            description: "Lichess Daily Featured Puzzle",
            gameUrl: `https://lichess.org/${data.game.id}`,
          };
        } catch {
          // Automatic fallback to curated offline
          return samplePuzzles[Math.floor(Math.random() * samplePuzzles.length)];
        }
      }

      // 2. ONLINE POOL (DEFAULT): Attempts to fetch random online puzzle, auto-classifies, with automatic offline fallback to Curated
      if (activeSource === "online") {
        try {
          const res = await fetch("https://api.chess.com/pub/puzzle/random");
          if (res.ok) {
            const data = await res.json();
            const tempGame = new Chess();
            tempGame.loadPgn(data.pgn);
            const history = tempGame.history({ verbose: true });
            const uciMoves = history.map(
              (m) => m.from + m.to + (m.promotion || "")
            );

            if (uciMoves.length > 0) {
              const classified = classifyPuzzle(data.fen, uciMoves);
              return {
                id: `online-${Date.now().toString().slice(-6)}`,
                fen: data.fen,
                moves: uciMoves,
                rating: classified.estimatedRating,
                themes: classified.themes,
                description: data.title || classified.description,
                gameUrl: data.url,
              };
            }
          }
        } catch {
          // Network failed or offline: will seamlessly fall through to Curated Offline pool below!
        }
      }

      // 3. CURATED OFFLINE / IMPORTED DATASET / AUTOMATIC FALLBACK
      const pool =
        activeSource === "imported" && importedPuzzles.length > 0
          ? importedPuzzles
          : samplePuzzles;

      // Filter by theme and rating
      let candidates = pool.filter((p) => {
        const matchTheme =
          theme === "All Themes" ||
          p.themes.some((t) => t.toLowerCase() === theme.toLowerCase());
        const matchRating =
          p.rating >= ratingRange.min && p.rating <= ratingRange.max;
        return matchTheme && matchRating;
      });

      if (candidates.length === 0) {
        candidates = pool.filter((p) => {
          return p.rating >= ratingRange.min && p.rating <= ratingRange.max;
        });
      }

      if (candidates.length === 0) {
        candidates = pool;
      }

      return candidates[Math.floor(Math.random() * candidates.length)];
    },
    [importedPuzzles]
  );

  return {
    source,
    setSource,
    importedPuzzles,
    isImporting,
    importFile,
    stats,
    recordSolved,
    recordFailed,
    fetchPuzzle,
  };
}
