import { useState, useEffect, useCallback } from "react";
import type { Move } from "chess.js";
import { Chessboard as ReactChessboard } from "react-chessboard";
import type { Arrow, Square } from "react-chessboard/dist/chessboard/types";
import { EvalBar } from "./EvalBar";
import { useGameReview } from "../hooks/useGameReview";
import type { MoveClassification } from "../hooks/useGameReview";
import "./GameReview.css";

interface GameReviewProps {
  moves: Move[];
  playerColor: "w" | "b";
  onExit: () => void;
}

const CLASSIFICATION_CONFIG: Record<
  MoveClassification,
  { label: string; symbol: string; badgeClass: string; icon: string }
> = {
  brilliant: { label: "Brilliant", symbol: "!!", badgeClass: "badge-brilliant", icon: "💎" },
  great: { label: "Best Move", symbol: "!", badgeClass: "badge-great", icon: "🎯" },
  good: { label: "Good", symbol: "✓", badgeClass: "badge-good", icon: "✓" },
  book: { label: "Book Move", symbol: "📖", badgeClass: "badge-book", icon: "📖" },
  inaccuracy: { label: "Inaccuracy", symbol: "?!", badgeClass: "badge-inaccuracy", icon: "⚠️" },
  mistake: { label: "Mistake", symbol: "?", badgeClass: "badge-mistake", icon: "❓" },
  blunder: { label: "Blunder", symbol: "??", badgeClass: "badge-blunder", icon: "❌" },
};

function getAccuracyLabel(acc: number): { label: string; color: string } {
  if (acc >= 95) return { label: "Grandmaster Level 🌟", color: "text-amber-400" };
  if (acc >= 88) return { label: "Masterful Precision 🔥", color: "text-emerald-400" };
  if (acc >= 80) return { label: "Strong & Accurate ⚡", color: "text-indigo-400" };
  if (acc >= 70) return { label: "Solid Tactical Play 👍", color: "text-blue-400" };
  if (acc >= 60) return { label: "Inconsistent ⚠️", color: "text-orange-400" };
  return { label: "Needs Practice 🎯", color: "text-rose-400" };
}

export function GameReview({ moves, playerColor, onExit }: GameReviewProps) {
  const [selectedPly, setSelectedPly] = useState(moves.length > 0 ? 1 : 0);
  const { analyses, isAnalyzing, progress, stats } = useGameReview(moves, playerColor, 12);

  // Determine current position FEN
  let currentFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  if (moves.length > 0) {
    if (selectedPly === 0) {
      currentFen = moves[0].before;
    } else if (selectedPly <= moves.length) {
      currentFen = moves[selectedPly - 1].after;
    }
  }

  // Keyboard navigation: Left/Right arrows, Home/End
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowLeft") {
        setSelectedPly((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setSelectedPly((prev) => Math.min(moves.length, prev + 1));
      } else if (e.key === "Home") {
        setSelectedPly(0);
      } else if (e.key === "End") {
        setSelectedPly(moves.length);
      }
    },
    [moves.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Current move analysis (if selectedPly > 0)
  const currentAnalysis = selectedPly > 0 ? analyses[selectedPly - 1] : null;
  const currentEval = currentAnalysis ? currentAnalysis.evalAfter : analyses[0]?.evalBefore || null;

  // Custom Arrows on board: Best Move & Played Move
  const getCustomArrows = (): Arrow[] => {
    if (!currentAnalysis) return [];

    const arrows: Arrow[] = [];

    // Engine's recommended move (green arrow)
    if (currentAnalysis.bestMoveUci && currentAnalysis.bestMoveUci.length >= 4) {
      const bFrom = currentAnalysis.bestMoveUci.slice(0, 2) as Square;
      const bTo = currentAnalysis.bestMoveUci.slice(2, 4) as Square;

      // Only show best move arrow if it's different from what player played or if player made a great move
      if (currentAnalysis.classification === "great" || currentAnalysis.classification === "brilliant") {
        arrows.push([bFrom, bTo, "rgb(39, 166, 68)"]);
      } else {
        arrows.push([bFrom, bTo, "rgba(39, 166, 68, 0.85)"]);
      }
    }

    // Master theory recommended move (amber arrow) if distinct from engine best move
    if (
      currentAnalysis.theorySuggestion &&
      currentAnalysis.theorySuggestion.uci &&
      currentAnalysis.theorySuggestion.uci.length >= 4 &&
      currentAnalysis.theorySuggestion.uci !== currentAnalysis.bestMoveUci &&
      currentAnalysis.classification !== "book" &&
      currentAnalysis.classification !== "great" &&
      currentAnalysis.classification !== "brilliant"
    ) {
      const tFrom = currentAnalysis.theorySuggestion.uci.slice(0, 2) as Square;
      const tTo = currentAnalysis.theorySuggestion.uci.slice(2, 4) as Square;
      arrows.push([tFrom, tTo, "rgba(245, 158, 11, 0.85)"]);
    }

    // Played move arrow
    const pFrom = currentAnalysis.from as Square;
    const pTo = currentAnalysis.to as Square;

    if (
      currentAnalysis.classification === "blunder" ||
      currentAnalysis.classification === "mistake" ||
      currentAnalysis.classification === "inaccuracy"
    ) {
      // Red/Orange arrow for mistakes
      arrows.push([pFrom, pTo, "rgb(235, 87, 87)"]);
    } else if (currentAnalysis.classification === "brilliant") {
      arrows.push([pFrom, pTo, "rgb(38, 198, 218)"]);
    }

    return arrows;
  };

  // Custom Square Styles
  const getCustomSquareStyles = () => {
    if (!currentAnalysis) return {};
    const styles: Record<string, React.CSSProperties> = {};

    styles[currentAnalysis.from] = {
      backgroundColor: "rgba(94, 106, 210, 0.35)",
    };
    styles[currentAnalysis.to] = {
      backgroundColor: "rgba(94, 106, 210, 0.45)",
      boxShadow: "inset 0 0 0 2px var(--color-primary)",
    };

    return styles;
  };

  // Generate move pairs for list
  const movePairs: {
    num: number;
    whitePly: number;
    whiteSan: string;
    whiteAnalysis?: typeof analyses[0];
    blackPly?: number;
    blackSan?: string;
    blackAnalysis?: typeof analyses[0];
  }[] = [];

  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      whitePly: i + 1,
      whiteSan: moves[i].san,
      whiteAnalysis: analyses[i],
      blackPly: i + 1 < moves.length ? i + 2 : undefined,
      blackSan: i + 1 < moves.length ? moves[i + 1].san : undefined,
      blackAnalysis: i + 1 < moves.length ? analyses[i + 1] : undefined,
    });
  }

  const accuracyData = getAccuracyLabel(stats.playerAccuracy);

  return (
    <div className="review-container">
      {/* Left: Board Area */}
      <div className="board-area">
        <div className="board-with-eval">
          <EvalBar evaluation={currentEval} isFlipped={playerColor === "b"} />
          <div className="board-wrapper">
            <ReactChessboard
              position={currentFen}
              boardOrientation={playerColor === "w" ? "white" : "black"}
              arePiecesDraggable={false}
              customArrows={getCustomArrows()}
              customSquareStyles={getCustomSquareStyles()}
              animationDuration={200}
            />
          </div>
        </div>

        {/* Stepper Navigation Bar */}
        <div className="review-stepper-bar" role="toolbar" aria-label="Game review navigation">
          <button
            type="button"
            className="review-step-btn"
            onClick={() => setSelectedPly(0)}
            disabled={selectedPly === 0}
            aria-label="First move"
            title="Start of game (Home)"
          >
            ⏮
          </button>
          <button
            type="button"
            className="review-step-btn"
            onClick={() => setSelectedPly((prev) => Math.max(0, prev - 1))}
            disabled={selectedPly === 0}
            aria-label="Previous move"
            title="Previous move (Left Arrow)"
          >
            ◀
          </button>

          <span className="font-mono text-xs font-semibold px-2 min-w-[80px] text-center text-[var(--text-secondary)]">
            {selectedPly === 0 ? (
              "Start"
            ) : (
              <>
                Ply {selectedPly}/{moves.length}
              </>
            )}
          </span>

          <button
            type="button"
            className="review-step-btn"
            onClick={() => setSelectedPly((prev) => Math.min(moves.length, prev + 1))}
            disabled={selectedPly >= moves.length}
            aria-label="Next move"
            title="Next move (Right Arrow)"
          >
            ▶
          </button>
          <button
            type="button"
            className="review-step-btn"
            onClick={() => setSelectedPly(moves.length)}
            disabled={selectedPly >= moves.length}
            aria-label="Last move"
            title="End of game (End)"
          >
            ⏭
          </button>
        </div>
      </div>

      {/* Right: Sidebar */}
      <div className="sidebar" role="region" aria-label="Review Sidebar">
        {/* Header with Exit */}
        <div className="flex justify-between items-center pb-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[var(--text-primary)]">🔍 Game Review</span>
            {isAnalyzing && (
              <span className="text-xs font-semibold text-[var(--color-primary-hover)] animate-pulse">
                Analyzing... {Math.round(progress * 100)}%
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onExit}
            className="btn btn-secondary text-xs px-2.5 py-1"
            aria-label="Exit review mode and return to play"
          >
            ✕ Exit Review
          </button>
        </div>

        {/* Analysis Progress Bar */}
        {isAnalyzing && (
          <div className="analysis-progress-bar">
            <div
              className="analysis-progress-fill"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}

        {/* Overall Accuracy & Performance Summary */}
        <div className="accuracy-card">
          <div className="accuracy-header">
            <div>
              <div className="accuracy-label">
                {playerColor === "w" ? "White (You)" : "White (Bot)"} Accuracy
              </div>
              <div className="accuracy-score-box">
                <span className="accuracy-value text-[var(--color-primary-hover)]">
                  {stats.whiteAccuracy}%
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="accuracy-label">
                {playerColor === "b" ? "Black (You)" : "Black (Bot)"} Accuracy
              </div>
              <div className="accuracy-score-box justify-end">
                <span className="accuracy-value text-slate-300">{stats.blackAccuracy}%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-[var(--text-muted)]">Your Performance:</span>
            <span className={`font-semibold ${accuracyData.color}`}>{accuracyData.label}</span>
          </div>

          {/* Detected Overall Opening */}
          {stats.overallOpening?.name && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 rounded">
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <span>📖</span> Opening:
              </span>
              <span
                className="text-[var(--text-primary)] font-medium text-right truncate max-w-[190px]"
                title={`${stats.overallOpening.name} ${stats.overallOpening.eco ? `(${stats.overallOpening.eco})` : ""}`}
              >
                {stats.overallOpening.name}
                {stats.overallOpening.eco ? ` (${stats.overallOpening.eco})` : ""}
              </span>
            </div>
          )}

          {/* Classification Breakdown Badges */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 text-xs">
            {(
              [
                "brilliant",
                "great",
                "good",
                "book",
                "inaccuracy",
                "mistake",
                "blunder",
              ] as MoveClassification[]
            ).map((key) => {
              const conf = CLASSIFICATION_CONFIG[key];
              const pCount =
                playerColor === "w" ? stats.whiteCounts[key] : stats.blackCounts[key];
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between px-2 py-1 rounded ${conf.badgeClass}`}
                  title={`${conf.label}: ${pCount} moves`}
                >
                  <span className="font-semibold">{conf.symbol}</span>
                  <span className="font-mono font-bold">{pCount}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Move Explanation / Suggestion Card */}
        <div className="status-card" role="status" aria-live="polite">
          {selectedPly === 0 ? (
            <div className="text-center py-2 text-xs text-[var(--text-muted)]">
              <p className="font-semibold text-[var(--text-secondary)] mb-1">
                🏁 Initial Board Position
              </p>
              <p>Press ▶ or Right Arrow key to step through the game review.</p>
            </div>
          ) : currentAnalysis ? (
            <div className="flex flex-col gap-2.5">
              {/* Move header and classification badge */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-sm text-[var(--text-primary)]">
                    {currentAnalysis.moveNumber}.{currentAnalysis.color === "w" ? "" : ".."}
                  </span>
                  <span className="font-extrabold text-sm text-[var(--text-primary)]">
                    {currentAnalysis.san}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    ({currentAnalysis.color === "w" ? "White" : "Black"})
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold inline-flex items-center gap-1 ${
                    CLASSIFICATION_CONFIG[currentAnalysis.classification].badgeClass
                  }`}
                >
                  <span>{CLASSIFICATION_CONFIG[currentAnalysis.classification].icon}</span>
                  <span>{CLASSIFICATION_CONFIG[currentAnalysis.classification].label}</span>
                </span>
              </div>

              {/* Coaching suggestion */}
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic bg-[var(--bg-surface)] p-2 rounded border border-[var(--border-subtle)]">
                {currentAnalysis.explanation}
              </p>

              {/* Theory Recommendation Highlight if available */}
              {currentAnalysis.theorySuggestion && currentAnalysis.classification !== "book" && (
                <div className="flex flex-col gap-1.5 bg-amber-500/10 border border-amber-500/25 p-2 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                      <span>📖</span> Theory Recommendation
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {currentAnalysis.theorySuggestion.san}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-amber-200/80">
                    <span className="truncate max-w-[150px]">
                      {currentAnalysis.theorySuggestion.openingName || "Opening Line"}
                    </span>
                    <span>
                      {currentAnalysis.theorySuggestion.totalGames.toLocaleString()} master games
                    </span>
                  </div>
                  <div
                    className="winrate-bar-container"
                    title={`White: ${currentAnalysis.theorySuggestion.whiteWinPct}% | Draw: ${currentAnalysis.theorySuggestion.drawPct}% | Black: ${currentAnalysis.theorySuggestion.blackWinPct}%`}
                  >
                    <div
                      className="winrate-white"
                      style={{ width: `${currentAnalysis.theorySuggestion.whiteWinPct}%` }}
                    />
                    <div
                      className="winrate-draw"
                      style={{ width: `${currentAnalysis.theorySuggestion.drawPct}%` }}
                    />
                    <div
                      className="winrate-black"
                      style={{ width: `${currentAnalysis.theorySuggestion.blackWinPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Engine Comparison details */}
              <div className="flex flex-col gap-1 text-xs pt-1 border-t border-[var(--border-subtle)]">
                <div className="flex justify-between items-center">
                  <span className="label text-xs">Evaluation</span>
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    {currentAnalysis.evalAfter.scoreFormatted}
                  </span>
                </div>

                {currentAnalysis.classification !== "great" &&
                  currentAnalysis.classification !== "brilliant" &&
                  currentAnalysis.classification !== "book" && (
                    <div className="flex justify-between items-center">
                      <span className="label text-xs">Stockfish Suggestion</span>
                      <span className="font-mono font-bold text-[var(--color-success)]">
                        {currentAnalysis.bestMoveSan} ({currentAnalysis.evalBefore.scoreFormatted})
                      </span>
                    </div>
                  )}

                {currentAnalysis.cpLoss > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="label text-xs">Eval Loss</span>
                    <span className="font-mono text-[var(--color-danger)]">
                      -{(currentAnalysis.cpLoss / 100).toFixed(2)} pawns
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-[var(--text-muted)] animate-pulse">
              Evaluating move {selectedPly}...
            </div>
          )}
        </div>

        {/* Master Book Suggestions (for opening positions) */}
        {currentAnalysis && currentAnalysis.masterMoves && currentAnalysis.masterMoves.length > 0 && (
          <div className="status-card flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="label text-xs font-semibold text-[var(--color-warning)]">
                📖 Master Book ({currentAnalysis.openingName || "Opening"})
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {currentAnalysis.masterMoves.slice(0, 3).map((bm) => (
                <div key={bm.san} className="flex flex-col gap-1 text-xs bg-[var(--bg-surface)] p-1.5 rounded border border-[var(--border-subtle)]">
                  <div className="flex justify-between items-center font-mono">
                    <span className="font-bold text-[var(--text-primary)]">{bm.san}</span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {bm.totalGames.toLocaleString()} games
                    </span>
                  </div>
                  <div className="winrate-bar-container" title={`White: ${bm.whiteWinPct}% | Draw: ${bm.drawPct}% | Black: ${bm.blackWinPct}%`}>
                    <div className="winrate-white" style={{ width: `${bm.whiteWinPct}%` }} />
                    <div className="winrate-draw" style={{ width: `${bm.drawPct}%` }} />
                    <div className="winrate-black" style={{ width: `${bm.blackWinPct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Move List Grid */}
        <div className="move-history-container flex-1">
          <div className="move-history-title">Move Review List ({moves.length} plies)</div>
          <div className="review-move-grid">
            {movePairs.map((pair) => (
              <div key={pair.num} className="review-move-row">
                <span className="text-[var(--text-muted)] font-semibold">{pair.num}.</span>

                {/* White Move */}
                <button
                  type="button"
                  className={`review-move-cell ${selectedPly === pair.whitePly ? "active-ply" : ""}`}
                  onClick={() => setSelectedPly(pair.whitePly)}
                >
                  <span>{pair.whiteSan}</span>
                  {pair.whiteAnalysis && (
                    <span
                      className={`move-symbol ${
                        CLASSIFICATION_CONFIG[pair.whiteAnalysis.classification].badgeClass
                      } px-1 rounded`}
                    >
                      {CLASSIFICATION_CONFIG[pair.whiteAnalysis.classification].symbol}
                    </span>
                  )}
                </button>

                {/* Black Move */}
                {pair.blackSan && pair.blackPly ? (
                  <button
                    type="button"
                    className={`review-move-cell ${selectedPly === pair.blackPly ? "active-ply" : ""}`}
                    onClick={() => setSelectedPly(pair.blackPly!)}
                  >
                    <span>{pair.blackSan}</span>
                    {pair.blackAnalysis && (
                      <span
                        className={`move-symbol ${
                          CLASSIFICATION_CONFIG[pair.blackAnalysis.classification].badgeClass
                        } px-1 rounded`}
                      >
                        {CLASSIFICATION_CONFIG[pair.blackAnalysis.classification].symbol}
                      </span>
                    )}
                  </button>
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="controls mt-auto pt-2 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={onExit}
            className="btn btn-primary text-xs w-full"
          >
            ← Back to Chessboard
          </button>
        </div>
      </div>
    </div>
  );
}
