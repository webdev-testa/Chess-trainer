import { useState, useEffect, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard as ReactChessboard } from "react-chessboard";
import { samplePuzzles, RATINGS, THEMES } from "../data/samplePuzzles";
import type { Puzzle } from "../data/samplePuzzles";
import "./ChessBoard.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Chessboard = ReactChessboard as any;

export function PuzzleBoard() {
  const [game, setGame] = useState(new Chess());
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [status, setStatus] = useState<"playing" | "solved" | "failed">(
    "playing",
  );

  // Modes: 'daily' (API) or 'custom' (Local Filtered)
  const [mode, setMode] = useState<"daily" | "custom">("daily");

  // Selection State
  const [selectedTheme, setSelectedTheme] = useState("All Themes");
  const [selectedRatingLabel, setSelectedRatingLabel] = useState("All Ratings");

  // Hint & Solution State
  const [hintLevel, setHintLevel] = useState(0); // 0=None, 1=Highlight, 2=Arrow
  const [showSolution, setShowSolution] = useState(false);
  const [solutionStep, setSolutionStep] = useState(0);

  const loadDailyPuzzle = useCallback(async () => {
    try {
      const res = await fetch("https://lichess.org/api/puzzle/daily");
      const data = await res.json();

      // Convert Lichess API data to our Puzzle interface
      // We need to replay the game to get the FEN
      const tempGame = new Chess();
      tempGame.loadPgn(data.game.pgn);
      const history = tempGame.history({ verbose: true });

      const startParams = new Chess();
      for (let i = 0; i < data.puzzle.initialPly; i++) {
        startParams.move(history[i]);
      }

      const dailyPuzzle: Puzzle = {
        id: data.puzzle.id,
        fen: startParams.fen(),
        moves: data.puzzle.solution,
        rating: data.puzzle.rating,
        themes: data.puzzle.themes,
        description: "Lichess Daily Puzzle",
      };

      return dailyPuzzle;
    } catch (e) {
      console.error("Failed to load daily puzzle", e);
      alert("Failed to load daily puzzle. Please check your connection.");
      return null;
    }
  }, []);

  // Load a random puzzle based on filters
  const loadPuzzle = useCallback(async () => {
    let puzzleToLoad: Puzzle | null = null;

    if (mode === "daily") {
      puzzleToLoad = await loadDailyPuzzle();
    } else {
      const ratingRange =
        RATINGS.find((r) => r.label === selectedRatingLabel) || RATINGS[0];

      const candidates = samplePuzzles.filter((p) => {
        const matchTheme =
          selectedTheme === "All Themes" || p.themes.includes(selectedTheme);
        const matchRating =
          p.rating >= ratingRange.min && p.rating <= ratingRange.max;
        return matchTheme && matchRating;
      });

      if (candidates.length === 0) {
        alert("No puzzles found for these criteria!");
        return;
      }
      puzzleToLoad = candidates[Math.floor(Math.random() * candidates.length)];
    }

    if (puzzleToLoad) {
      setCurrentPuzzle(puzzleToLoad);
      const newGame = new Chess(puzzleToLoad.fen);
      setGame(newGame);
      setCurrentMoveIndex(0);
      setStatus("playing");
      setHintLevel(0);
      setShowSolution(false);
      setSolutionStep(0);
    }
  }, [selectedTheme, selectedRatingLabel, mode, loadDailyPuzzle]);

  useEffect(() => {
    loadPuzzle();
  }, [mode, loadPuzzle]); // Reload when mode changes

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (status !== "playing" || !currentPuzzle || showSolution) return false;

    const gameCopy = new Chess(game.fen());

    // Attempt move
    let move = gameCopy.move({
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

      // Clear hints on correct move
      setHintLevel(0);

      if (nextIndex >= currentPuzzle.moves.length) {
        setStatus("solved");
      } else {
        // Opponent Move
        setTimeout(() => {
          const opponentMoveUci = currentPuzzle.moves[nextIndex];
          const from = opponentMoveUci.slice(0, 2);
          const to = opponentMoveUci.slice(2, 4);
          const promotion =
            opponentMoveUci.length > 4 ? opponentMoveUci[4] : undefined;

          gameCopy.move({ from, to, promotion });
          setGame(new Chess(gameCopy.fen()));
          setCurrentMoveIndex(nextIndex + 1);
        }, 500);
      }
      return true;
    } else {
      // Wrong move
      if (hintLevel === 0) setHintLevel(1); // Auto-trigger level 1 hint on fail
      return false;
    }
  };

  // --- Solution Walkthrough ---
  const toggleSolutionMode = () => {
    if (!currentPuzzle) return;
    setShowSolution(!showSolution);
    // Reset to start position for walkthrough
    const startFen = currentPuzzle.fen;
    setGame(new Chess(startFen));
    setSolutionStep(0);
    setStatus("playing"); // Reset status so visuals are clean
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

  // --- Hint Logic ---
  const getCustomSquareStyles = () => {
    if (hintLevel >= 1 && currentPuzzle && status === "playing") {
      const nextMove = currentPuzzle.moves[currentMoveIndex]; // e.g. "e2e4"
      if (!nextMove) return {};
      const fromSquare = nextMove.slice(0, 2);
      return {
        [fromSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
      };
    }
    return {};
  };

  const getCustomArrows = () => {
    if (hintLevel >= 2 && currentPuzzle && status === "playing") {
      const nextMove = currentPuzzle.moves[currentMoveIndex];
      if (!nextMove) return [];
      const from = nextMove.slice(0, 2);
      const to = nextMove.slice(2, 4);
      return [[from, to, "rgb(0, 128, 0)"]];
    }
    return [];
  };

  if (!currentPuzzle)
    return <div className="text-white text-center p-4">Loading Puzzles...</div>;

  return (
    <div className="chessboard-container">
      {/* Left: Board Area */}
      <div className="board-area">
        <div className="board-wrapper">
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            arePiecesDraggable={!showSolution && status === "playing"}
            customSquareStyles={getCustomSquareStyles()}
            customArrows={getCustomArrows()}
          />
        </div>
        <div className="absolute top-4 left-0 w-full text-center pointer-events-none">
          {/* Overlay status messages if needed, or keep them in sidebar/below board. Keeping original message location below board for now but styled better */}
          {status === "solved" && (
            <div className="inline-block bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-lg font-bold animate-bounce pointer-events-auto">
              Puzzle Solved! 🎉
            </div>
          )}
          {status === "failed" && (
            <div className="inline-block bg-red-500 text-white px-4 py-2 rounded-full shadow-lg text-lg font-bold pointer-events-auto">
              Wrong Move
            </div>
          )}
        </div>
      </div>

      {/* Right: Sidebar */}
      <div className="sidebar">
        <h2>{mode === "daily" ? "Daily Puzzle" : "Custom Puzzle"}</h2>

        <div className="status-card mb-4">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold text-lg">#{currentPuzzle.id}</span>
            <span className="bg-blue-600 px-2 py-0.5 rounded text-sm">
              {currentPuzzle.rating} ELO
            </span>
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {currentPuzzle.themes.join(" | ")}
          </div>
          <p className="text-gray-400 text-sm mb-3 italic">
            {currentPuzzle.description}
          </p>
        </div>

        {/* Filters & Mode Toggle */}
        <div className="flex flex-col gap-10 mb-6">
          <div className="controls mb-6">
            <button
              className={`flex-1 py-2 rounded font-medium transition-colors ${
                mode === "daily"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              onClick={() => setMode("daily")}
            >
              Daily
            </button>
            <button
              className={`flex-1 py-2 rounded font-medium transition-colors ${
                mode === "custom"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              onClick={() => setMode("custom")}
            >
              Custom
            </button>
          </div>

          {mode === "custom" && (
            <div className="flex flex-col gap-3 p-3 bg-gray-800 rounded">
              <Select
                value={selectedTheme}
                onValueChange={(val) => setSelectedTheme(val)}
              >
                <SelectTrigger className="w-full bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  {THEMES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedRatingLabel}
                onValueChange={(val) => setSelectedRatingLabel(val)}
              >
                <SelectTrigger className="w-full bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  {RATINGS.map((r) => (
                    <SelectItem key={r.label} value={r.label}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="pt-6">
            <button
              onClick={() => loadPuzzle()}
              className="btn btn-daily w-full py-3"
            >
              {mode === "daily" ? "Reload Daily" : "New Puzzle"}
            </button>
          </div>
        </div>

        {/* Combined Hints & Solution Row */}
        {!showSolution && status === "playing" ? (
          <div className="border-t border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-400">
                Assistance
              </h3>
              <span className="text-xs text-gray-500">Hints {hintLevel}/2</span>
            </div>

            <div className="controls">
              <button
                onClick={toggleSolutionMode}
                className="flex-1 btn btn-secondary text-sm"
              >
                Solution
              </button>
              <button
                onClick={() => setHintLevel((prev) => Math.min(prev + 1, 2))}
                disabled={hintLevel >= 2}
                className={`flex-1 p-2 rounded font-semibold transition-colors text-sm ${
                  hintLevel >= 2
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-600 hover:bg-yellow-500 text-white"
                }`}
              >
                {hintLevel === 0
                  ? "Show Hint"
                  : hintLevel === 1
                    ? "Show Arrow"
                    : "Max Hints"}
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-700 pt-4 mt-auto">
            {status !== "playing" && !showSolution && (
              <div className="mb-4 text-center">
                {status === "solved" ? (
                  <div className="text-green-500 font-bold mb-2">
                    Puzzle Solved!
                  </div>
                ) : (
                  <div className="text-red-500 font-bold mb-2">Failed</div>
                )}
                <button
                  onClick={toggleSolutionMode}
                  className="btn btn-secondary w-full"
                >
                  Review Solution
                </button>
              </div>
            )}
          </div>
        )}

        {/* Solution Mode Overlay Controls */}
        {showSolution && (
          <div className="border-t border-gray-700 pt-4 mt-auto">
            <div className="flex flex-col gap-2">
              <div className="text-blue-400 text-center text-sm font-bold mb-1">
                Solution Mode
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    toggleSolutionMode();
                    if (status !== "playing") loadPuzzle();
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Close
                </button>
                <button
                  onClick={nextSolutionStep}
                  disabled={solutionStep >= currentPuzzle.moves.length}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  Next Step
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
