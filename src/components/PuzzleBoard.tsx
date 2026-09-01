import { useState, useEffect, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard as ReactChessboard } from "react-chessboard";
import type { Arrow, Square } from "react-chessboard/dist/chessboard/types";
import { THEMES, RATINGS } from "../data/samplePuzzles";
import type { Puzzle } from "../data/samplePuzzles";
import { usePuzzleDatabase } from "../hooks/usePuzzleDatabase";
import type { PuzzleSource } from "../hooks/usePuzzleDatabase";
import "./ChessBoard.css";

export function PuzzleBoard() {
  const {
    source,
    setSource,
    importedPuzzles,
    isImporting,
    importFile,
    stats,
    recordSolved,
    recordFailed,
    fetchPuzzle,
  } = usePuzzleDatabase();

  const [game, setGame] = useState(() => new Chess());
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [status, setStatus] = useState<"playing" | "solved" | "failed">("playing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Selection Filters
  const [selectedTheme, setSelectedTheme] = useState("All Themes");
  const [selectedRatingLabel, setSelectedRatingLabel] = useState("All Ratings");

  // Hint & Solution State
  const [hintLevel, setHintLevel] = useState(0); // 0=None, 1=Highlight, 2=Arrow
  const [showSolution, setShowSolution] = useState(false);
  const [solutionStep, setSolutionStep] = useState(0);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  const opponentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clear opponent move timer on unmount
  useEffect(() => {
    return () => {
      if (opponentTimerRef.current) {
        clearTimeout(opponentTimerRef.current);
      }
    };
  }, []);

  // Load a puzzle based on active source and filters
  const loadPuzzle = useCallback(
    async (customSource?: PuzzleSource) => {
      if (opponentTimerRef.current) {
        clearTimeout(opponentTimerRef.current);
      }
      setErrorMessage(null);
      setIsLoading(true);

      const targetSource = customSource || source;
      try {
        const puzzleToLoad = await fetchPuzzle(
          targetSource,
          selectedTheme,
          selectedRatingLabel
        );

        if (!puzzleToLoad) {
          setErrorMessage(
            "No puzzles found for the selected theme and rating criteria."
          );
          setIsLoading(false);
          return;
        }

        setCurrentPuzzle(puzzleToLoad);
        setGame(new Chess(puzzleToLoad.fen));
        setCurrentMoveIndex(0);
        setStatus("playing");
        setHintLevel(0);
        setShowSolution(false);
        setSolutionStep(0);
      } catch {
        setErrorMessage("Failed to load puzzle. Please check your connection or try another source.");
      } finally {
        setIsLoading(false);
      }
    },
    [source, selectedTheme, selectedRatingLabel, fetchPuzzle]
  );

  useEffect(() => {
    loadPuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  // Keyboard shortcut: Escape to close upload modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showUploadModal) {
        setShowUploadModal(false);
        setUploadSuccessMessage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showUploadModal]);

  // Piece drop logic (UCI comparison)
  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (status !== "playing" || !currentPuzzle || showSolution) return false;

    const gameCopy = new Chess(game.fen());

    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (!move) return false;

    // Check vs Solution
    const expectedMoveUci = currentPuzzle.moves[currentMoveIndex];
    const actualMoveUci = move.from + move.to + (move.promotion || "");

    if (actualMoveUci === expectedMoveUci) {
      setGame(gameCopy);
      const nextIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(nextIndex);
      setHintLevel(0);

      if (nextIndex >= currentPuzzle.moves.length) {
        setStatus("solved");
        recordSolved();
      } else {
        // Opponent Move
        if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
        opponentTimerRef.current = setTimeout(() => {
          const opponentMoveUci = currentPuzzle.moves[nextIndex];
          const from = opponentMoveUci.slice(0, 2);
          const to = opponentMoveUci.slice(2, 4);
          const promotion =
            opponentMoveUci.length > 4 ? opponentMoveUci[4] : undefined;

          gameCopy.move({ from, to, promotion });
          setGame(new Chess(gameCopy.fen()));
          setCurrentMoveIndex(nextIndex + 1);
        }, 450);
      }
      return true;
    } else {
      if (hintLevel === 0) setHintLevel(1);
      setStatus("failed");
      recordFailed();
      return false;
    }
  };

  const toggleSolutionMode = () => {
    if (!currentPuzzle) return;
    setShowSolution(!showSolution);
    setGame(new Chess(currentPuzzle.fen));
    setSolutionStep(0);
  };

  const nextSolutionStep = () => {
    if (!currentPuzzle || solutionStep >= currentPuzzle.moves.length) return;

    const gameCopy = new Chess(game.fen());
    const moveUci = currentPuzzle.moves[solutionStep];
    const from = moveUci.slice(0, 2);
    const to = moveUci.slice(2, 4);
    const promotion = moveUci.length > 4 ? moveUci[4] : undefined;

    gameCopy.move({ from, to, promotion });
    setGame(gameCopy);
    setSolutionStep(solutionStep + 1);
  };

  const getCustomSquareStyles = () => {
    if (hintLevel >= 1 && currentPuzzle && status === "playing") {
      const nextMove = currentPuzzle.moves[currentMoveIndex];
      if (!nextMove) return {};
      const fromSquare = nextMove.slice(0, 2);
      return {
        [fromSquare]: { backgroundColor: "rgba(242, 153, 74, 0.45)", boxShadow: "inset 0 0 0 2px #f2994a" },
      };
    }
    return {};
  };

  const getCustomArrows = (): Arrow[] => {
    if (hintLevel >= 2 && currentPuzzle && status === "playing") {
      const nextMove = currentPuzzle.moves[currentMoveIndex];
      if (!nextMove) return [];
      const from = nextMove.slice(0, 2) as Square;
      const to = nextMove.slice(2, 4) as Square;
      return [[from, to, "rgb(39, 166, 68)"]];
    }
    return [];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const count = await importFile(file);
      setUploadSuccessMessage(`Successfully imported ${count.toLocaleString()} puzzles!`);
      loadPuzzle("imported");
    } catch {
      setUploadSuccessMessage("Error parsing puzzle file. Please check format.");
    }
  };

  const playerColor = currentPuzzle
    ? new Chess(currentPuzzle.fen).turn() === "b"
      ? "black"
      : "white"
    : "white";

  const totalAttempts = stats.solved + stats.failed;
  const accuracyPct = totalAttempts > 0 ? Math.round((stats.solved / totalAttempts) * 100) : 100;

  return (
    <div className="chessboard-container">
      {/* Left: Board Area */}
      <div className="board-area">
        <div className="board-wrapper">
          <ReactChessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            boardOrientation={playerColor}
            arePiecesDraggable={!showSolution && status !== "solved"}
            customSquareStyles={getCustomSquareStyles()}
            customArrows={getCustomArrows()}
            animationDuration={250}
          />
        </div>

        <div
          className="absolute top-4 left-0 w-full text-center pointer-events-none"
          role="status"
          aria-live="polite"
        >
          {status === "solved" && (
            <div className="inline-block bg-[var(--color-success)] text-white px-4 py-1.5 rounded-full shadow-lg text-sm font-semibold pointer-events-auto border border-emerald-400/40">
              Puzzle Solved! 🎉
            </div>
          )}
          {status === "failed" && (
            <div className="inline-block bg-[var(--color-danger)] text-white px-4 py-1.5 rounded-full shadow-lg text-sm font-semibold pointer-events-auto border border-rose-400/40">
              Incorrect Move — Try Again or Click Hint
            </div>
          )}
        </div>
      </div>

      {/* Right: Sidebar */}
      <div className="sidebar" role="region" aria-label="Puzzle Sidebar">
        {/* Source Mode Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
            Puzzle Source
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-[var(--bg-surface-elevated)] p-1.5 rounded-lg border border-[var(--border-subtle)]">
            <button
              type="button"
              className={`btn text-xs py-1.5 ${source === "online" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSource("online")}
              aria-pressed={source === "online"}
            >
              🌐 Online Pool
            </button>
            <button
              type="button"
              className={`btn text-xs py-1.5 ${source === "daily" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSource("daily")}
              aria-pressed={source === "daily"}
            >
              📅 Daily
            </button>
            <button
              type="button"
              className={`btn text-xs py-1.5 ${source === "offline" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSource("offline")}
              aria-pressed={source === "offline"}
            >
              💾 Curated (Offline)
            </button>
            <button
              type="button"
              className={`btn text-xs py-1.5 ${source === "imported" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => {
                if (importedPuzzles.length === 0) {
                  setShowUploadModal(true);
                } else {
                  setSource("imported");
                }
              }}
              aria-pressed={source === "imported"}
            >
              📤 Dataset ({importedPuzzles.length})
            </button>
          </div>
          <button
            type="button"
            className="btn btn-secondary text-xs py-1.5 w-full mt-1"
            onClick={() => setShowUploadModal(true)}
          >
            ⚙️ Upload / Import Custom Dataset
          </button>
        </div>

        {/* User Stats Card */}
        <div className="status-card p-3 flex justify-between items-center text-xs">
          <div>
            <span className="text-[var(--text-muted)]">🔥 Streak: </span>
            <span className="font-semibold text-[var(--color-warning)] font-mono">{stats.streak}</span>
            <span className="text-[var(--text-tertiary)] ml-1">(Best: {stats.bestStreak})</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Solved: </span>
            <span className="font-semibold text-[var(--color-success)] font-mono">{stats.solved}</span>
            <span className="text-[var(--text-muted)] ml-2">Acc: </span>
            <span className="font-semibold text-[var(--color-primary-hover)] font-mono">{accuracyPct}%</span>
          </div>
        </div>

        {/* Puzzle Card Details */}
        {errorMessage ? (
          <div className="p-3 bg-[var(--color-danger-bg)] border border-[var(--color-danger)] rounded-lg text-red-200 text-xs" role="alert">
            <p className="font-semibold mb-2">{errorMessage}</p>
            <button
              type="button"
              onClick={() => loadPuzzle()}
              className="btn btn-secondary text-xs mt-1"
            >
              Retry
            </button>
          </div>
        ) : isLoading || !currentPuzzle ? (
          <div className="status-card p-5 text-center text-[var(--text-muted)] text-xs">
            <p className="animate-pulse">Loading tactical puzzle...</p>
          </div>
        ) : (
          <div className="status-card" role="region" aria-label="Current Puzzle Details">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-semibold text-sm text-[var(--text-primary)] font-mono">
                #{currentPuzzle.id}
              </span>
              <span className="bg-[var(--color-primary)] text-white font-semibold px-2.5 py-0.5 rounded text-xs font-mono">
                {currentPuzzle.rating} ELO
              </span>
            </div>

            {/* Tactical Theme Badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {currentPuzzle.themes.map((t) => (
                <span
                  key={t}
                  className="bg-[var(--bg-surface)] text-[var(--color-primary-hover)] border border-[var(--border-subtle)] text-xs font-medium px-2 py-0.5 rounded"
                >
                  {t}
                </span>
              ))}
            </div>

            <p className="text-[var(--text-muted)] text-xs mt-2.5 italic leading-relaxed">
              {currentPuzzle.description}
            </p>

            {currentPuzzle.gameUrl && (
              <a
                href={currentPuzzle.gameUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-primary-hover)] hover:underline mt-1.5 inline-block"
              >
                🔗 View original game on Lichess
              </a>
            )}

            <div className="status-row mt-3 pt-2.5 border-t border-[var(--border-subtle)] text-xs">
              <span className="label">Turn to Move</span>
              <span className="value inline-flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full inline-block ${
                    playerColor === "white"
                      ? "bg-slate-100 ring-2 ring-slate-400/50"
                      : "bg-slate-900 ring-2 ring-slate-600/60"
                  }`}
                />
                <span className="font-semibold">
                  {playerColor === "white" ? "White to move" : "Black to move"}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Filters (When not daily) */}
        {source !== "daily" && (
          <div className="flex flex-col gap-2.5 p-3 bg-[var(--bg-surface-elevated)] rounded-lg border border-[var(--border-subtle)]">
            <div className="flex flex-col gap-1">
              <label htmlFor="puzzle-theme-select" className="text-xs font-semibold text-[var(--text-muted)]">
                Tactical Theme
              </label>
              <select
                id="puzzle-theme-select"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full min-h-[36px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] cursor-pointer"
                aria-label="Select tactical theme"
              >
                {THEMES.map((t) => (
                  <option key={t} value={t} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="puzzle-rating-select" className="text-xs font-semibold text-[var(--text-muted)]">
                Rating Range
              </label>
              <select
                id="puzzle-rating-select"
                value={selectedRatingLabel}
                onChange={(e) => setSelectedRatingLabel(e.target.value)}
                className="w-full min-h-[36px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] cursor-pointer"
                aria-label="Select rating range"
              >
                {RATINGS.map((r) => (
                  <option key={r.label} value={r.label} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => loadPuzzle()}
            className="btn btn-primary w-full py-2 text-xs font-semibold"
            aria-label={source === "daily" ? "Reload daily puzzle" : "Load new puzzle"}
          >
            {source === "daily" ? "🔄 Reload Daily" : "Next Puzzle ⏭"}
          </button>
        </div>

        {/* Assistance Controls */}
        {!showSolution ? (
          <div className="border-t border-[var(--border-subtle)] pt-3 mt-auto flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[var(--text-secondary)]">Assistance</span>
              <span className="text-xs font-medium text-[var(--text-muted)] px-2 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                Hints {hintLevel}/2
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={toggleSolutionMode}
                className="btn btn-secondary text-xs font-semibold"
                aria-label="Reveal step-by-step solution"
              >
                Solution
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus("playing");
                  setHintLevel((prev) => Math.min(prev + 1, 2));
                }}
                disabled={hintLevel >= 2}
                className={`btn text-xs font-semibold ${
                  hintLevel >= 2
                    ? "btn-secondary opacity-40 cursor-not-allowed"
                    : "bg-[var(--color-warning)] hover:brightness-110 text-white shadow-sm"
                }`}
                aria-label="Get a hint for the next move"
              >
                {hintLevel === 0
                  ? "💡 Show Hint"
                  : hintLevel === 1
                    ? "🎯 Show Arrow"
                    : "Max Hints"}
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-[var(--border-subtle)] pt-3 mt-auto flex flex-col gap-2">
            <div className="text-[var(--color-primary-hover)] text-center text-xs font-semibold font-mono">
              Solution Walkthrough ({solutionStep}/{currentPuzzle?.moves.length || 0})
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={toggleSolutionMode}
                className="btn btn-secondary text-xs font-semibold"
              >
                Exit Solution
              </button>
              <button
                type="button"
                onClick={nextSolutionStep}
                disabled={!currentPuzzle || solutionStep >= currentPuzzle.moves.length}
                className="btn btn-primary text-xs font-semibold disabled:opacity-50"
              >
                Next Move
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File Upload Modal */}
      {showUploadModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              Upload Lichess Dataset / Custom Puzzles
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
              Upload your own downloaded puzzle files from{" "}
              <a
                href="https://database.lichess.org/#puzzles"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-primary-hover)] underline font-semibold"
              >
                database.lichess.org/#puzzles
              </a>{" "}
              (CSV, JSON, or PGN). Un-tagged puzzles will be automatically
              analyzed and classified with tactical themes!
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.json,.pgn,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full border border-dashed border-[var(--border-strong)] hover:border-[var(--border-focus)] bg-[var(--bg-surface-elevated)] p-5 rounded-lg text-center cursor-pointer transition-all mb-3"
            >
              <div className="text-xl mb-1">📂</div>
              <div className="text-xs font-semibold text-[var(--text-primary)]">
                {isImporting
                  ? "Importing & Classifying Puzzles..."
                  : "Click to Select or Drop Puzzle File"}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Supports Lichess CSV, JSON arrays, and PGNs
              </div>
            </button>

            {uploadSuccessMessage && (
              <div className="text-xs text-[var(--color-success)] font-semibold text-center mb-3">
                {uploadSuccessMessage}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadSuccessMessage(null);
                }}
                className="btn btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
