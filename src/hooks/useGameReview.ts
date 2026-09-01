import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import type { Move } from "chess.js";
import { fetchMasterOpeningData } from "../utils/openingIdentifier";
import type { MasterBookPosition } from "../utils/openingIdentifier";
import type { ExplorerMove } from "./useLichessExplorer";
import type { StockfishEvaluation } from "./useStockfish";

export type MoveClassification =
  | "brilliant"
  | "great"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export interface IdentifiedOpeningInfo {
  eco?: string;
  name: string;
}

export interface TheorySuggestion {
  san: string;
  uci: string;
  openingName?: string;
  totalGames: number;
  whiteWinPct: number;
  drawPct: number;
  blackWinPct: number;
}

export interface MoveAnalysis {
  ply: number;
  moveNumber: number;
  color: "w" | "b";
  san: string;
  lan: string;
  from: string;
  to: string;
  piece: string;
  captured?: string;
  fenBefore: string;
  fenAfter: string;
  evalBefore: StockfishEvaluation;
  evalAfter: StockfishEvaluation;
  bestMoveUci: string;
  bestMoveSan: string;
  cpLoss: number;
  classification: MoveClassification;
  explanation: string;
  openingName?: string;
  masterMoves?: ExplorerMove[];
  theorySuggestion?: TheorySuggestion;
}

export interface ReviewStats {
  whiteAccuracy: number;
  blackAccuracy: number;
  playerAccuracy: number;
  whiteCounts: Record<MoveClassification, number>;
  blackCounts: Record<MoveClassification, number>;
  overallOpening?: IdentifiedOpeningInfo;
}

const INITIAL_COUNTS: Record<MoveClassification, number> = {
  brilliant: 0,
  great: 0,
  good: 0,
  book: 0,
  inaccuracy: 0,
  mistake: 0,
  blunder: 0,
};

function formatScore(type: "cp" | "mate", val: number, turn: string): { formatted: string; whiteCp: number; whitePercent: number } {
  let whiteCp = turn === "w" ? val : -val;
  let scoreFormatted = "0.0";
  let whitePercentage = 50;

  if (type === "cp") {
    const clampedCp = Math.max(-1000, Math.min(1000, whiteCp));
    whitePercentage = 50 + 50 * (2 / (1 + Math.exp(-0.004 * clampedCp)) - 1);
    whitePercentage = Math.max(3, Math.min(97, whitePercentage));
    const valStr = (whiteCp / 100).toFixed(1);
    scoreFormatted = whiteCp > 0 ? `+${valStr}` : valStr;
    if (scoreFormatted === "-0.0") scoreFormatted = "0.0";
  } else if (type === "mate") {
    whiteCp = whiteCp > 0 ? 10000 : -10000;
    const whiteMate = turn === "w" ? val : -val;
    whitePercentage = whiteMate > 0 ? 100 : 0;
    scoreFormatted = whiteMate > 0 ? `M${whiteMate}` : `-M${Math.abs(whiteMate)}`;
  }

  return {
    formatted: scoreFormatted,
    whiteCp,
    whitePercent: Math.round(whitePercentage * 10) / 10,
  };
}

function computeMoveAccuracy(cpl: number): number {
  if (cpl <= 0) return 100;
  // Exponential falloff for accuracy
  const acc = 100 * Math.exp(-0.006 * cpl);
  return Math.max(0, Math.min(100, Math.round(acc * 10) / 10));
}

export function useGameReview(
  moves: Move[],
  playerColor: "w" | "b" = "w",
  depth = 12
) {
  const [analyses, setAnalyses] = useState<MoveAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ReviewStats>({
    whiteAccuracy: 100,
    blackAccuracy: 100,
    playerAccuracy: 100,
    whiteCounts: { ...INITIAL_COUNTS },
    blackCounts: { ...INITIAL_COUNTS },
  });

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!moves || moves.length === 0) {
      setAnalyses([]);
      setIsAnalyzing(false);
      setProgress(1);
      return;
    }

    let isCancelled = false;
    setIsAnalyzing(true);
    setProgress(0);
    setAnalyses([]);

    const worker = new Worker("/stockfish.js");
    workerRef.current = worker;

    // Helper to evaluate a position with the worker
    const evaluateFen = (fenToEval: string): Promise<{ bestMoveUci: string; evalData: StockfishEvaluation }> => {
      return new Promise((resolve) => {
        let lastScoreType: "cp" | "mate" = "cp";
        let lastScoreValue = 0;
        const turn = fenToEval.split(" ")[1] || "w";

        const handleMessage = (event: MessageEvent) => {
          const msg = event.data;
          if (typeof msg !== "string") return;

          if (msg.startsWith("info") && msg.includes("score")) {
            const scoreMatch = msg.match(/score (cp|mate) (-?\d+)/);
            if (scoreMatch) {
              lastScoreType = scoreMatch[1] as "cp" | "mate";
              lastScoreValue = parseInt(scoreMatch[2], 10);
            }
          } else if (msg.startsWith("bestmove")) {
            worker.removeEventListener("message", handleMessage);
            const moveUci = msg.split(" ")[1];
            const scoreInfo = formatScore(lastScoreType, lastScoreValue, turn);
            resolve({
              bestMoveUci: moveUci && moveUci !== "(none)" ? moveUci : "",
              evalData: {
                type: lastScoreType,
                value: lastScoreValue,
                scoreFormatted: scoreInfo.formatted,
                whitePercentage: scoreInfo.whitePercent,
              },
            });
          }
        };

        worker.addEventListener("message", handleMessage);
        worker.postMessage("stop");
        worker.postMessage(`position fen ${fenToEval}`);
        worker.postMessage(`go depth ${depth}`);
      });
    };

    const runAnalysis = async () => {
      worker.postMessage("uci");
      worker.postMessage("isready");
      await new Promise((r) => setTimeout(r, 100));

      // 1. Pre-fetch master book data for initial opening plies (up to ply 20)
      const masterBookMap = new Map<string, MasterBookPosition | null>();
      let deepestOpening: IdentifiedOpeningInfo | undefined = undefined;
      let outOfBook = false;

      const maxPliesToFetch = Math.min(moves.length, 20);
      for (let i = 0; i < maxPliesToFetch; i++) {
        if (isCancelled) return;
        if (outOfBook) break;

        const m = moves[i];
        if (!masterBookMap.has(m.before)) {
          const book = await fetchMasterOpeningData(m.before);
          masterBookMap.set(m.before, book);
          if (book?.openingName && book.openingName !== "Starting Position") {
            deepestOpening = { name: book.openingName, eco: book.eco };
          }
          if (!book || book.totalGames === 0 || book.moves.length === 0) {
            outOfBook = true;
          }
        }

        if (!outOfBook && !masterBookMap.has(m.after)) {
          const bookAfter = await fetchMasterOpeningData(m.after);
          masterBookMap.set(m.after, bookAfter);
          if (bookAfter?.openingName && bookAfter.openingName !== "Starting Position") {
            deepestOpening = { name: bookAfter.openingName, eco: bookAfter.eco };
          }
          if (!bookAfter || bookAfter.totalGames === 0 || bookAfter.moves.length === 0) {
            outOfBook = true;
          }
        }
      }

      const fenEvals: Map<string, { bestMoveUci: string; evalData: StockfishEvaluation }> = new Map();

      // Collect unique FENs to evaluate with Stockfish
      const fensToAnalyze: string[] = [];
      moves.forEach((m) => {
        if (!fensToAnalyze.includes(m.before)) fensToAnalyze.push(m.before);
        if (!fensToAnalyze.includes(m.after)) fensToAnalyze.push(m.after);
      });

      let completedFens = 0;
      for (const f of fensToAnalyze) {
        if (isCancelled) return;
        const evalRes = await evaluateFen(f);
        fenEvals.set(f, evalRes);
        completedFens++;
        setProgress(completedFens / fensToAnalyze.length);
      }

      if (isCancelled) return;

      // Build analysis for each move
      const results: MoveAnalysis[] = [];
      const whiteCounts = { ...INITIAL_COUNTS };
      const blackCounts = { ...INITIAL_COUNTS };
      const whiteAccuracies: number[] = [];
      const blackAccuracies: number[] = [];

      for (let i = 0; i < moves.length; i++) {
        const m = moves[i];
        const beforeRes = fenEvals.get(m.before) || {
          bestMoveUci: "",
          evalData: { type: "cp", value: 0, scoreFormatted: "0.0", whitePercentage: 50 },
        };
        const afterRes = fenEvals.get(m.after) || {
          bestMoveUci: "",
          evalData: { type: "cp", value: 0, scoreFormatted: "0.0", whitePercentage: 50 },
        };

        // Convert best move UCI to SAN
        let bestMoveSan = beforeRes.bestMoveUci;
        try {
          const tempGame = new Chess(m.before);
          const from = beforeRes.bestMoveUci.slice(0, 2);
          const to = beforeRes.bestMoveUci.slice(2, 4);
          const promotion = beforeRes.bestMoveUci.length > 4 ? beforeRes.bestMoveUci[4] : undefined;
          const parsed = tempGame.move({ from, to, promotion });
          if (parsed) {
            bestMoveSan = parsed.san;
          }
        } catch {
          // fallback to UCI
        }

        // Calculate centipawn loss from moving player's perspective
        const beforeScore = formatScore(beforeRes.evalData.type, beforeRes.evalData.value, m.before.split(" ")[1] || "w");
        const afterScore = formatScore(afterRes.evalData.type, afterRes.evalData.value, m.after.split(" ")[1] || "b");

        let cpLoss = 0;
        if (m.color === "w") {
          cpLoss = Math.max(0, beforeScore.whiteCp - afterScore.whiteCp);
        } else {
          cpLoss = Math.max(0, afterScore.whiteCp - beforeScore.whiteCp);
        }

        // If played move is identical to engine's best move, CPL is 0
        const isEngineBest =
          m.lan === beforeRes.bestMoveUci ||
          m.san === bestMoveSan ||
          (m.from + m.to) === beforeRes.bestMoveUci.slice(0, 4);

        if (isEngineBest) {
          cpLoss = 0;
        }

        // Master book check for this position
        const masterBook = masterBookMap.get(m.before) || null;
        const isBookMove =
          i < 20 &&
          masterBook !== null &&
          masterBook.moves.some(
            (bm) => bm.san === m.san || bm.uci === m.lan || bm.uci.startsWith(m.from + m.to)
          );

        const topBookMove =
          masterBook && masterBook.moves.length > 0 ? masterBook.moves[0] : null;

        const activeOpeningName =
          masterBook?.openingName || deepestOpening?.name || "standard opening line";

        let theorySuggestion: TheorySuggestion | undefined = undefined;
        if (masterBook && topBookMove && !isBookMove && masterBook.moves.length > 0) {
          theorySuggestion = {
            san: topBookMove.san,
            uci: topBookMove.uci,
            openingName: masterBook.openingName || deepestOpening?.name,
            totalGames: topBookMove.totalGames,
            whiteWinPct: topBookMove.whiteWinPct,
            drawPct: topBookMove.drawPct,
            blackWinPct: topBookMove.blackWinPct,
          };
        }

        // Classification & Explanations
        let classification: MoveClassification = "good";
        let explanation = "";

        // Check for brilliant sacrifice: piece sacrifice (not pawn) with 0 CPL leading to advantage
        const isSacrifice =
          ["n", "b", "r", "q"].includes(m.piece) &&
          !m.captured &&
          isEngineBest &&
          ((m.color === "w" && afterScore.whiteCp > 150) || (m.color === "b" && afterScore.whiteCp < -150));

        if (isSacrifice) {
          classification = "brilliant";
          explanation = `Brilliant move! An exceptional tactical sacrifice that secures a winning advantage.`;
        } else if (isBookMove) {
          classification = "book";
          explanation = `Book move in the ${activeOpeningName}.`;
        } else if (isEngineBest) {
          classification = "great";
          if (theorySuggestion && theorySuggestion.san !== m.san) {
            explanation = `The best engine move! Note: In the ${activeOpeningName}, master theory most commonly plays ${theorySuggestion.san} (${theorySuggestion.totalGames.toLocaleString()} master games).`;
          } else {
            explanation = `The best engine move! Accurately maintains the strongest position.`;
          }
        } else if (cpLoss <= 15) {
          classification = "good";
          if (theorySuggestion) {
            explanation = `A solid move, though deviates from ${activeOpeningName} theory. Masters most frequently played ${theorySuggestion.san} (${theorySuggestion.totalGames.toLocaleString()} games).`;
          } else {
            explanation = `A solid move that keeps the game balanced.`;
          }
        } else if (cpLoss <= 60) {
          classification = "inaccuracy";
          if (theorySuggestion) {
            explanation = `Inaccuracy (${(cpLoss / 100).toFixed(1)} pawn loss). In the ${activeOpeningName}, theory standard is ${theorySuggestion.san} (${theorySuggestion.totalGames.toLocaleString()} master games). Engine recommends ${bestMoveSan}.`;
          } else {
            explanation = `Inaccuracy (${(cpLoss / 100).toFixed(1)} pawn loss). ${bestMoveSan} was better (${beforeRes.evalData.scoreFormatted}).`;
          }
        } else if (cpLoss <= 180) {
          classification = "mistake";
          if (theorySuggestion) {
            explanation = `Mistake (${(cpLoss / 100).toFixed(1)} pawn loss). In the ${activeOpeningName}, standard theory plays ${theorySuggestion.san} (${theorySuggestion.totalGames.toLocaleString()} games). Stockfish recommends ${bestMoveSan}.`;
          } else {
            explanation = `Mistake (${(cpLoss / 100).toFixed(1)} pawn loss). Stockfish recommends ${bestMoveSan} (${beforeRes.evalData.scoreFormatted}).`;
          }
        } else {
          classification = "blunder";
          if (theorySuggestion) {
            explanation = `Blunder! Lost ${(cpLoss / 100).toFixed(1)} pawns. In the ${activeOpeningName}, master theory plays ${theorySuggestion.san}. Best was ${bestMoveSan} (${beforeRes.evalData.scoreFormatted}).`;
          } else {
            explanation = `Blunder! Lost ${(cpLoss / 100).toFixed(1)} pawns of evaluation. Best was ${bestMoveSan} (${beforeRes.evalData.scoreFormatted}).`;
          }
        }

        // Track stats
        if (m.color === "w") {
          whiteCounts[classification]++;
          whiteAccuracies.push(computeMoveAccuracy(cpLoss));
        } else {
          blackCounts[classification]++;
          blackAccuracies.push(computeMoveAccuracy(cpLoss));
        }

        results.push({
          ply: i,
          moveNumber: Math.floor(i / 2) + 1,
          color: m.color,
          san: m.san,
          lan: m.lan,
          from: m.from,
          to: m.to,
          piece: m.piece,
          captured: m.captured,
          fenBefore: m.before,
          fenAfter: m.after,
          evalBefore: beforeRes.evalData,
          evalAfter: afterRes.evalData,
          bestMoveUci: beforeRes.bestMoveUci,
          bestMoveSan,
          cpLoss,
          classification,
          explanation,
          openingName: masterBook?.openingName || deepestOpening?.name,
          masterMoves: masterBook?.moves,
          theorySuggestion,
        });
      }

      if (isCancelled) return;

      const whiteAvgAcc =
        whiteAccuracies.length > 0
          ? Math.round(
              (whiteAccuracies.reduce((a, b) => a + b, 0) / whiteAccuracies.length) * 10
            ) / 10
          : 100;
      const blackAvgAcc =
        blackAccuracies.length > 0
          ? Math.round(
              (blackAccuracies.reduce((a, b) => a + b, 0) / blackAccuracies.length) * 10
            ) / 10
          : 100;

      setAnalyses(results);
      setStats({
        whiteAccuracy: whiteAvgAcc,
        blackAccuracy: blackAvgAcc,
        playerAccuracy: playerColor === "w" ? whiteAvgAcc : blackAvgAcc,
        whiteCounts,
        blackCounts,
        overallOpening: deepestOpening,
      });
      setIsAnalyzing(false);
      setProgress(1);
    };

    runAnalysis();

    return () => {
      isCancelled = true;
      worker.terminate();
    };
  }, [moves, playerColor, depth]);

  return {
    analyses,
    isAnalyzing,
    progress,
    stats,
  };
}
