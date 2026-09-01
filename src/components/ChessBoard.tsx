import { useState, useCallback, useEffect, useRef } from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";
import { Chess } from "chess.js";
import type { Move } from "chess.js";
import { useStockfish } from "../hooks/useStockfish";
import { EvalBar } from "./EvalBar";
import { GameReview } from "./GameReview";
import "./ChessBoard.css";

type PlayMode = "bot" | "analysis";
type BotDifficulty =
  | "beginner"
  | "casual"
  | "novice"
  | "intermediate"
  | "club"
  | "advanced"
  | "candidate_master"
  | "master"
  | "grandmaster";

interface BotDifficultyConfig {
  id: BotDifficulty;
  name: string;
  depth: number;
  skillLevel: number;
  elo: string;
}

const BOT_DIFFICULTIES: BotDifficultyConfig[] = [
  { id: "beginner", name: "Beginner", depth: 1, skillLevel: 0, elo: "~600 ELO" },
  { id: "casual", name: "Casual", depth: 2, skillLevel: 2, elo: "~800 ELO" },
  { id: "novice", name: "Novice", depth: 4, skillLevel: 5, elo: "~1000 ELO" },
  { id: "intermediate", name: "Intermediate", depth: 6, skillLevel: 8, elo: "~1200 ELO" },
  { id: "club", name: "Club Player", depth: 8, skillLevel: 11, elo: "~1600 ELO" },
  { id: "advanced", name: "Advanced", depth: 10, skillLevel: 14, elo: "~1800 ELO" },
  { id: "candidate_master", name: "Candidate Master", depth: 12, skillLevel: 17, elo: "~2000 ELO" },
  { id: "master", name: "Master", depth: 14, skillLevel: 19, elo: "~2200 ELO" },
  { id: "grandmaster", name: "Grandmaster", depth: 18, skillLevel: 20, elo: "~2700+ ELO" },
];

export function ChessBoard() {
  const [game, setGame] = useState(() => new Chess());
  const [playMode, setPlayMode] = useState<PlayMode>("bot");
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("intermediate");
  const [showEval, setShowEval] = useState(true);

  // Review mode state & move history ref
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewMoves, setReviewMoves] = useState<Move[]>([]);
  const moveHistoryRef = useRef<Move[]>([]);

  // Resignation state
  const [resignedWinner, setResignedWinner] = useState<"White" | "Black" | null>(null);
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  const fen = game.fen();
  const turn = game.turn();
  const isGameOver = game.isGameOver();
  const isCheckmate = game.isCheckmate();
  const inCheck = game.inCheck();
  const isDraw = game.isDraw();
  const isGameEnded = isGameOver || !!resignedWinner;

  const currentDiff = BOT_DIFFICULTIES.find((d) => d.id === botDifficulty);
  const selectedDepth = currentDiff?.depth || 8;
  const selectedSkill = currentDiff?.skillLevel ?? 11;
  const isBotTurn = playMode === "bot" && turn !== playerColor && !isGameEnded;

  const { bestMove, evaluation } = useStockfish(
    fen,
    playMode === "bot" && isBotTurn ? selectedDepth : 15,
    showEval || isBotTurn,
    playMode === "bot" && isBotTurn ? selectedSkill : 20
  );

  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear bot timer on unmount
  useEffect(() => {
    return () => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts: 'F' to flip board, 'Escape' to dismiss modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" || e.key === "F") {
        setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
      } else if (e.key === "Escape" && showResignConfirm) {
        setShowResignConfirm(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showResignConfirm]);

  // Bot move execution
  useEffect(() => {
    if (isBotTurn && bestMove && !isGameEnded) {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);

      botTimerRef.current = setTimeout(() => {
        setGame((prevGame) => {
          const gameCopy = new Chess(prevGame.fen());
          const from = bestMove.slice(0, 2);
          const to = bestMove.slice(2, 4);
          const promotion = bestMove.length > 4 ? bestMove[4] : undefined;

          try {
            const move = gameCopy.move({ from, to, promotion });
            if (move) {
              moveHistoryRef.current.push(move);
            }
            return gameCopy;
          } catch {
            return prevGame;
          }
        });
      }, 450);
    }
  }, [isBotTurn, bestMove, isGameEnded]);

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      if (isGameEnded) return false;
      if (playMode === "bot" && turn !== playerColor) return false;

      const gameCopy = new Chess(game.fen());
      try {
        const move = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });
        if (move) {
          moveHistoryRef.current.push(move);
          setGame(gameCopy);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [game, isGameEnded, playMode, turn, playerColor]
  );

  const handleResign = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    const winner = playerColor === "w" ? "Black" : "White";
    setResignedWinner(winner);
    setShowResignConfirm(false);
  }, [playerColor]);

  const undoMove = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setResignedWinner(null);
    setShowResignConfirm(false);

    setGame((prevGame) => {
      const gameCopy = new Chess(prevGame.fen());
      if (playMode === "bot") {
        // In bot mode, undo 2 plies so player stays on their turn
        gameCopy.undo();
        gameCopy.undo();
        moveHistoryRef.current.splice(-2);
      } else {
        gameCopy.undo();
        moveHistoryRef.current.splice(-1);
      }
      return gameCopy;
    });
  }, [playMode]);

  const resetGame = useCallback(
    (newPlayerColor?: "w" | "b") => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);

      const colorToSet = newPlayerColor || playerColor;
      setGame(new Chess());
      moveHistoryRef.current = [];
      setResignedWinner(null);
      setShowResignConfirm(false);
      setBoardOrientation(colorToSet === "w" ? "white" : "black");
      if (newPlayerColor) setPlayerColor(newPlayerColor);
    },
    [playerColor]
  );

  const startReview = useCallback(() => {
    if (moveHistoryRef.current.length === 0) return;
    setReviewMoves([...moveHistoryRef.current]);
    setIsReviewing(true);
  }, []);

  const toggleOrientation = () => {
    setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
  };

  if (isReviewing) {
    return (
      <GameReview
        moves={reviewMoves}
        playerColor={playerColor}
        onExit={() => setIsReviewing(false)}
      />
    );
  }

  const gameOverMessage = resignedWinner
    ? `${resignedWinner} wins by resignation!`
    : isGameOver
      ? isCheckmate
        ? `Checkmate! ${turn === "w" ? "Black" : "White"} wins!`
        : isDraw
          ? "Draw (Stalemate / Repetition)!"
          : "Game Over"
      : null;

  // Generate move pairs for history list
  const history = game.history();
  const movePairs: { num: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  const isDraggable = !isGameEnded && (playMode === "analysis" || turn === playerColor);

  return (
    <div className="chessboard-container">
      {/* Left: Board Area */}
      <div className="board-area">
        <div className="board-with-eval">
          {showEval && <EvalBar evaluation={evaluation} />}
          <div className="board-wrapper">
            <ReactChessboard
              position={fen}
              onPieceDrop={onDrop}
              boardOrientation={boardOrientation}
              arePiecesDraggable={isDraggable}
              animationDuration={250}
            />
          </div>
        </div>
      </div>

      {/* Right: Sidebar */}
      <div className="sidebar" role="region" aria-label="Game Sidebar">
        {/* Play Mode Switcher */}
        <div className="mode-toggle-container">
          <button
            type="button"
            className={`mode-toggle-btn ${playMode === "bot" ? "active" : ""}`}
            onClick={() => setPlayMode("bot")}
            aria-pressed={playMode === "bot"}
          >
            🤖 Play vs Bot
          </button>
          <button
            type="button"
            className={`mode-toggle-btn ${playMode === "analysis" ? "active" : ""}`}
            onClick={() => setPlayMode("analysis")}
            aria-pressed={playMode === "analysis"}
          >
            🔍 Analysis
          </button>
        </div>

        {/* Bot Controls (When in bot mode) */}
        {playMode === "bot" && (
          <div className="status-card flex flex-col gap-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="label">Play As</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    playerColor === "w"
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                  }`}
                  onClick={() => resetGame("w")}
                >
                  ⚪ White
                </button>
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    playerColor === "b"
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                  }`}
                  onClick={() => resetGame("b")}
                >
                  ⚫ Black
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="bot-difficulty-select" className="label text-xs">
                Bot Strength
              </label>
              <select
                id="bot-difficulty-select"
                value={botDifficulty}
                onChange={(e) => setBotDifficulty(e.target.value as BotDifficulty)}
                className="w-full min-h-[36px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs font-medium text-[var(--text-primary)] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]"
              >
                {BOT_DIFFICULTIES.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {d.name}: Depth {d.depth} ({d.elo})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="status-card" role="status" aria-live="polite">
          <div className="status-header">
            <span className="status-title">Match Status</span>
            <span className="status-turn font-medium">
              {isGameEnded ? "Game Complete" : turn === "w" ? "White's turn" : "Black's turn"}
            </span>
          </div>

          <div className="status-body">
            <div className="status-row">
              <span className="label">Turn to Move</span>
              <span className="value font-semibold">
                {turn === "w" ? "⚪ White" : "⚫ Black"}
              </span>
            </div>

            <div className="status-row">
              <span className="label">Game State</span>
              <span className={`value ${isCheckmate ? "danger" : inCheck ? "warning" : ""}`}>
                {isCheckmate
                  ? "Checkmate!"
                  : inCheck
                    ? "Check!"
                    : isDraw
                      ? "Draw"
                      : "Active"}
              </span>
            </div>

            {showEval && evaluation && (
              <div className="status-row">
                <span className="label">Stockfish Eval</span>
                <span className="value font-mono text-[var(--text-primary)]">
                  {evaluation.scoreFormatted}
                </span>
              </div>
            )}

            {showEval && bestMove && playMode === "analysis" && (
              <div className="status-row">
                <span className="label">Recommended Move</span>
                <span className="value text-[var(--color-success)] font-mono">{bestMove}</span>
              </div>
            )}
          </div>

          {gameOverMessage && (
            <div className="game-over flex flex-col gap-2" role="alert" aria-live="assertive">
              <div className="font-semibold">{gameOverMessage}</div>
              <button
                type="button"
                onClick={startReview}
                className="btn-review-banner"
                aria-label="Review match moves and accuracy analysis"
              >
                <span>🔍</span>
                <span>Review Game & Accuracy</span>
              </button>
            </div>
          )}
        </div>

        {/* Resignation Confirmation Dialog */}
        {showResignConfirm && (
          <div
            className="status-card bg-[var(--color-danger-bg)] border border-[var(--color-danger)] flex flex-col gap-2.5 p-3.5 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resign-dialog-title"
          >
            <span id="resign-dialog-title" className="text-xs font-semibold text-red-200">
              Are you sure you want to resign the game?
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResign}
                className="btn bg-[var(--color-danger)] text-white text-xs py-2 px-3 font-semibold hover:brightness-110 shadow-sm"
                aria-label="Confirm resignation"
              >
                🏳️ Yes, Resign
              </button>
              <button
                type="button"
                onClick={() => setShowResignConfirm(false)}
                className="btn btn-secondary text-xs py-2 px-3"
                aria-label="Cancel resignation"
                autoFocus
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Move History */}
        {movePairs.length > 0 && (
          <div className="move-history-container">
            <div className="move-history-title">Move History ({history.length} plies)</div>
            <div className="move-history-grid">
              {movePairs.map((pair) => (
                <div key={pair.num} className="contents">
                  <span className="move-idx">{pair.num}.</span>
                  <span className="move-san">{pair.white}</span>
                  <span className="move-san">{pair.black || ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="controls">
          <button
            type="button"
            onClick={toggleOrientation}
            className="btn btn-secondary text-xs"
            aria-label="Flip board orientation (shortcut: F)"
            title="Press 'F' to flip board"
          >
            🔄 Flip Board
          </button>

          <button
            type="button"
            onClick={() => setShowEval(!showEval)}
            className={`btn text-xs ${
              showEval ? "btn-secondary" : "bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
            }`}
            aria-label="Toggle Stockfish evaluation bar"
          >
            {showEval ? "📊 Hide Eval" : "📊 Show Eval"}
          </button>

          <button
            type="button"
            onClick={startReview}
            disabled={moveHistoryRef.current.length === 0}
            className="btn btn-secondary text-xs"
            aria-label="Review game moves and analysis"
            title="Analyze moves and get post-game review"
          >
            🔍 Review
          </button>
        </div>

        <div className="controls mt-auto pt-2 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setShowResignConfirm(true)}
            disabled={history.length === 0 || isGameEnded}
            className="btn btn-secondary text-xs hover:border-[var(--color-danger)] hover:text-red-400"
            aria-label="Resign game"
            title="Resign the current game"
          >
            🏳️ Resign
          </button>
          <button
            type="button"
            onClick={undoMove}
            disabled={history.length === 0}
            className="btn btn-secondary text-xs"
            aria-label="Undo move"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => resetGame()}
            className="btn btn-primary text-xs"
            aria-label="Start a new game"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}
