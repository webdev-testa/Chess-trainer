import { useState, useCallback, useEffect, useRef } from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useStockfish } from "../hooks/useStockfish";
import { EvalBar } from "./EvalBar";
import "./ChessBoard.css";

type PlayMode = "bot" | "analysis";
type BotDifficulty = "novice" | "intermediate" | "advanced" | "master";

const BOT_DIFFICULTIES: { id: BotDifficulty; name: string; depth: number; elo: string }[] = [
  { id: "novice", name: "Novice (Depth 4)", depth: 4, elo: "~1000 ELO" },
  { id: "intermediate", name: "Club Player (Depth 8)", depth: 8, elo: "~1600 ELO" },
  { id: "advanced", name: "Master (Depth 14)", depth: 14, elo: "~2200 ELO" },
  { id: "master", name: "Grandmaster (Depth 18)", depth: 18, elo: "~2700+ ELO" },
];

export function ChessBoard() {
  const [game, setGame] = useState(() => new Chess());
  const [playMode, setPlayMode] = useState<PlayMode>("bot");
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("intermediate");
  const [showEval, setShowEval] = useState(true);

  const fen = game.fen();
  const turn = game.turn();
  const isGameOver = game.isGameOver();
  const isCheckmate = game.isCheckmate();
  const isDraw = game.isDraw();

  const selectedDepth = BOT_DIFFICULTIES.find((d) => d.id === botDifficulty)?.depth || 8;
  const isBotTurn = playMode === "bot" && turn !== playerColor && !isGameOver;

  const { bestMove, evaluation } = useStockfish(
    fen,
    playMode === "bot" ? selectedDepth : 15,
    showEval || isBotTurn
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

  // Keyboard shortcut: Press 'F' to flip board
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" || e.key === "F") {
        setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Bot move execution
  useEffect(() => {
    if (isBotTurn && bestMove && !isGameOver) {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);

      botTimerRef.current = setTimeout(() => {
        setGame((prevGame) => {
          const gameCopy = new Chess(prevGame.fen());
          const from = bestMove.slice(0, 2);
          const to = bestMove.slice(2, 4);
          const promotion = bestMove.length > 4 ? bestMove[4] : undefined;

          try {
            gameCopy.move({ from, to, promotion });
            return gameCopy;
          } catch {
            return prevGame;
          }
        });
      }, 450);
    }
  }, [isBotTurn, bestMove, isGameOver]);

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      if (isGameOver) return false;
      if (playMode === "bot" && turn !== playerColor) return false;

      const gameCopy = new Chess(game.fen());
      try {
        const move = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });
        if (move) {
          setGame(gameCopy);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [game, isGameOver, playMode, turn, playerColor]
  );

  const undoMove = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    setGame((prevGame) => {
      const gameCopy = new Chess(prevGame.fen());
      if (playMode === "bot") {
        // In bot mode, undo 2 plies so player stays on their turn
        gameCopy.undo();
        gameCopy.undo();
      } else {
        gameCopy.undo();
      }
      return gameCopy;
    });
  }, [playMode]);

  const resetGame = useCallback(
    (newPlayerColor?: "w" | "b") => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);

      const colorToSet = newPlayerColor || playerColor;
      setGame(new Chess());
      setBoardOrientation(colorToSet === "w" ? "white" : "black");
      if (newPlayerColor) setPlayerColor(newPlayerColor);
    },
    [playerColor]
  );

  const toggleOrientation = () => {
    setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
  };

  const gameOverMessage = isGameOver
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

  const isDraggable = !isGameOver && (playMode === "analysis" || turn === playerColor);

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
              <label htmlFor="bot-difficulty-select" className="label text-[11px]">
                Bot Strength
              </label>
              <select
                id="bot-difficulty-select"
                value={botDifficulty}
                onChange={(e) => setBotDifficulty(e.target.value as BotDifficulty)}
                className="w-full min-h-[32px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs font-medium text-[var(--text-primary)] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]"
              >
                {BOT_DIFFICULTIES.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {d.name} ({d.elo})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="status-card" role="status" aria-live="polite" aria-atomic="true">
          <div className="status-info">
            <div className="status-row">
              <span className="label">Current Turn</span>
              <span className="value inline-flex items-center gap-1.5">
                {isBotTurn ? (
                  <span className="text-[var(--color-warning)] font-semibold animate-pulse">
                    🤖 Bot thinking...
                  </span>
                ) : (
                  <>
                    <span
                      className={`w-2.5 h-2.5 rounded-full inline-block ${
                        turn === "w"
                          ? "bg-slate-100 ring-2 ring-slate-400/50"
                          : "bg-slate-900 ring-2 ring-slate-600/60"
                      }`}
                    />
                    <span>{turn === "w" ? "White to move" : "Black to move"}</span>
                  </>
                )}
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
            <div className="game-over" role="alert" aria-live="assertive">
              {gameOverMessage}
            </div>
          )}
        </div>

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
        </div>

        <div className="controls mt-auto pt-2 border-t border-[var(--border-subtle)]">
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
