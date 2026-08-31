import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";
import { Chess } from "chess.js";
import openingsData from "../data/openings.json";
import { useStockfish } from "../hooks/useStockfish";
import { useLichessExplorer } from "../hooks/useLichessExplorer";
import { CURATED_OPENING_TREE, getFenKey } from "../data/openingTree";
import { identifyOpeningFromFen } from "../utils/openingIdentifier";
import { EvalBar } from "./EvalBar";
import "./ChessBoard.css";
import "./OpeningExplorer.css";

export interface OpeningVariation {
  id: string;
  eco: string;
  name: string;
  parentOpening: "Caro-Kann Defense" | "Queen's Gambit";
  variation: string;
  moves: string;
  fen: string;
  category: "Caro-Kann" | "Queen's Gambit";
  side: "white" | "black";
  description: string;
  keyIdeas: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

export interface PlyStep {
  ply: number;
  moveNumber: number;
  color: "w" | "b";
  san: string;
  from: string;
  to: string;
  fen: string;
}

const openings: OpeningVariation[] = openingsData as OpeningVariation[];

const PARENT_GROUPS = ["All", "Caro-Kann", "Queen's Gambit"] as const;

function parseOpeningSteps(movesStr: string): PlyStep[] {
  const game = new Chess();
  const tokens = movesStr.trim().split(/\s+/).filter(Boolean);
  const steps: PlyStep[] = [
    {
      ply: 0,
      moveNumber: 0,
      color: "w",
      san: "Start",
      from: "",
      to: "",
      fen: game.fen(),
    },
  ];

  let ply = 0;
  for (const token of tokens) {
    if (/^\d+\.+$/.test(token)) {
      continue;
    }
    try {
      const move = game.move(token);
      if (move) {
        ply++;
        steps.push({
          ply,
          moveNumber: Math.ceil(ply / 2),
          color: move.color,
          san: move.san,
          from: move.from,
          to: move.to,
          fen: game.fen(),
        });
      }
    } catch {
      // Ignore if any invalid token
    }
  }

  return steps;
}

export function OpeningExplorer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("All");

  // Default to null (Universal Move 1 starting position)
  const [selectedOpening, setSelectedOpening] = useState<OpeningVariation | null>(null);

  // Mode: "explore" | "practice"
  const [mode, setMode] = useState<"explore" | "practice">("explore");

  // Step-by-step history of the current opening (or start position if null)
  const steps = useMemo(() => parseOpeningSteps(selectedOpening?.moves || ""), [selectedOpening]);
  const [currentPly, setCurrentPly] = useState<number>(0);

  // Free exploration branch (if user makes moves off the main line)
  const [explorationMoves, setExplorationMoves] = useState<string[]>([]);
  const [freeGame, setFreeGame] = useState<Chess | null>(null);

  // Orientation & Auto-play & Engine & Explorer Panel Tab (default to white & masterTree)
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEngine, setShowEngine] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"masterTree" | "variations" | "details">("masterTree");
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tempToken, setTempToken] = useState("");

  // Practice Mode State
  const [practicePly, setPracticePly] = useState(0);
  const [practiceStatus, setPracticeStatus] = useState<"playing" | "correct" | "wrong" | "completed">("playing");
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const opponentReplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Current FEN calculation
  const currentFen = useMemo(() => {
    if (mode === "practice") {
      return steps[practicePly]?.fen || steps[0].fen;
    }
    if (freeGame) {
      return freeGame.fen();
    }
    return steps[currentPly]?.fen || steps[0].fen;
  }, [mode, practicePly, steps, freeGame, currentPly]);

  // Stockfish evaluation for current position
  const { evaluation, bestMove } = useStockfish(showEngine ? currentFen : "");

  // Lichess Opening Explorer API hook
  const {
    data: lichessData,
    isLoading: isLichessLoading,
    token: lichessToken,
    saveToken: saveLichessToken,
  } = useLichessExplorer(currentFen);

  // Fallback / Merged Master Tree data from curated offline tree
  const activeTreeData = useMemo(() => {
    if (lichessData && lichessData.moves && lichessData.moves.length > 0) {
      return lichessData;
    }
    const key = getFenKey(currentFen);
    const fallback = CURATED_OPENING_TREE[key];
    if (fallback) {
      return {
        opening: { eco: fallback.eco, name: fallback.openingName },
        moves: fallback.moves,
        topGames: fallback.topGames,
        totalGames: fallback.moves.reduce((acc, m) => acc + m.totalGames, 0),
      };
    }
    return null;
  }, [lichessData, currentFen]);

  // Dynamically identify the opening of the current board position
  const liveIdentifiedOpening = useMemo(() => {
    if (activeTreeData?.opening) {
      return activeTreeData.opening;
    }
    return identifyOpeningFromFen(currentFen);
  }, [activeTreeData, currentFen]);

  // Update opening selection from sub-variations catalogue
  const handleSelectOpening = useCallback((opening: OpeningVariation) => {
    setSelectedOpening(opening);
    const newSteps = parseOpeningSteps(opening.moves);
    setCurrentPly(newSteps.length - 1);
    setFreeGame(null);
    setExplorationMoves([]);
    setIsPlaying(false);
    setBoardOrientation(opening.side === "black" ? "black" : "white");
    setPracticePly(0);
    setPracticeStatus("playing");
    setHintLevel(0);
    setFeedbackMessage(null);
    setSidebarTab("details");
  }, []);

  // Filter openings
  const filteredOpenings = useMemo(() => {
    return openings.filter((op) => {
      const matchGroup =
        selectedGroup === "All" || op.category === selectedGroup;
      if (!matchGroup) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        op.name.toLowerCase().includes(term) ||
        op.eco.toLowerCase().includes(term) ||
        op.variation.toLowerCase().includes(term) ||
        op.moves.toLowerCase().includes(term) ||
        op.description.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, selectedGroup]);

  // Group filtered openings dynamically by Parent opening
  const groupedOpenings = useMemo(() => {
    return filteredOpenings.reduce<Record<string, OpeningVariation[]>>((acc, op) => {
      (acc[op.parentOpening] = acc[op.parentOpening] || []).push(op);
      return acc;
    }, {});
  }, [filteredOpenings]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      if (opponentReplyTimerRef.current) clearTimeout(opponentReplyTimerRef.current);
    };
  }, []);

  // Auto-play stepper
  useEffect(() => {
    if (isPlaying && mode === "explore") {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentPly((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPlaying, steps.length, mode]);

  // Stepping Navigation
  const goToStart = useCallback(() => {
    setIsPlaying(false);
    setFreeGame(null);
    setExplorationMoves([]);
    setCurrentPly(0);
  }, []);

  const goToPrev = useCallback(() => {
    setIsPlaying(false);
    if (freeGame) {
      const g = new Chess();
      g.loadPgn(freeGame.pgn());
      g.undo();
      if (g.history().length === 0) {
        setFreeGame(null);
        setExplorationMoves([]);
      } else {
        setFreeGame(g);
        setExplorationMoves(g.history());
      }
      return;
    }
    setCurrentPly((prev) => Math.max(0, prev - 1));
  }, [freeGame]);

  const goToNext = useCallback(() => {
    setIsPlaying(false);
    if (freeGame) return;
    setCurrentPly((prev) => Math.min(steps.length - 1, prev + 1));
  }, [freeGame, steps.length]);

  const goToEnd = useCallback(() => {
    setIsPlaying(false);
    setFreeGame(null);
    setExplorationMoves([]);
    setCurrentPly(steps.length - 1);
  }, [steps.length]);

  const toggleAutoPlay = useCallback(() => {
    if (currentPly >= steps.length - 1) {
      setCurrentPly(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentPly, steps.length]);

  const jumpToPly = useCallback((plyIndex: number) => {
    setIsPlaying(false);
    setFreeGame(null);
    setExplorationMoves([]);
    setCurrentPly(plyIndex);
  }, []);

  // Universal Explorer Start (from move 1)
  const startUniversalExplorer = () => {
    setSelectedOpening(null);
    setIsPlaying(false);
    setMode("explore");
    setSidebarTab("masterTree");
    setFreeGame(null);
    setExplorationMoves([]);
    setCurrentPly(0);
    setBoardOrientation("white");
  };

  // Handle Practice Opponent Reply
  useEffect(() => {
    if (mode !== "practice") return;
    if (practicePly >= steps.length - 1 || practiceStatus === "completed") return;

    const nextStep = steps[practicePly + 1];
    if (!nextStep) return;

    const isUserTurn =
      boardOrientation === "white"
        ? nextStep.color === "w"
        : nextStep.color === "b";

    if (!isUserTurn) {
      opponentReplyTimerRef.current = setTimeout(() => {
        const nextPly = practicePly + 1;
        setPracticePly(nextPly);
        setHintLevel(0);

        if (nextPly >= steps.length - 1) {
          setPracticeStatus("completed");
          setFeedbackMessage("🎉 Opening sequence mastered! Excellent execution.");
        } else {
          setPracticeStatus("playing");
          setFeedbackMessage(null);
        }
      }, 550);
    }

    return () => {
      if (opponentReplyTimerRef.current) clearTimeout(opponentReplyTimerRef.current);
    };
  }, [mode, practicePly, steps, boardOrientation, practiceStatus]);

  // Switch to Practice
  const startPractice = () => {
    if (!selectedOpening) {
      // Default to first opening if none picked
      setSelectedOpening(openings[0]);
    }
    setMode("practice");
    setPracticePly(0);
    setPracticeStatus("playing");
    setHintLevel(0);
    setFeedbackMessage(null);
    setIsPlaying(false);
    setFreeGame(null);
  };

  // Switch to Explore
  const exitPractice = () => {
    setMode("explore");
    setCurrentPly(steps.length - 1);
    setFreeGame(null);
    setFeedbackMessage(null);
  };

  // Play a move directly from the Master Candidate Moves Table
  const playMasterMove = (san: string) => {
    const baseFen = freeGame ? freeGame.fen() : steps[currentPly]?.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const testGame = new Chess(baseFen);

    try {
      const move = testGame.move(san);
      if (!move) return;

      const nextStep = steps[currentPly + 1];
      if (selectedOpening && !freeGame && nextStep && move.san === nextStep.san) {
        setCurrentPly((prev) => prev + 1);
      } else {
        const activeGame = freeGame || new Chess(baseFen);
        activeGame.move(san);
        setFreeGame(new Chess(activeGame.fen()));
        setExplorationMoves(activeGame.history());
      }
    } catch {
      // ignore
    }
  };

  // Piece drop logic (Drag & Drop)
  const onPieceDrop = (sourceSquare: string, targetSquare: string) => {
    if (mode === "practice") {
      if (practiceStatus === "completed") return false;

      const nextExpected = steps[practicePly + 1];
      if (!nextExpected) return false;

      const testGame = new Chess(steps[practicePly].fen);
      const move = testGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (!move) return false;

      if (move.san === nextExpected.san || (move.from === nextExpected.from && move.to === nextExpected.to)) {
        const nextPly = practicePly + 1;
        setPracticePly(nextPly);
        setHintLevel(0);

        if (nextPly >= steps.length - 1) {
          setPracticeStatus("completed");
          setFeedbackMessage("🎉 Line mastered! Excellent job.");
        } else {
          setPracticeStatus("correct");
          setFeedbackMessage(`Good move! ${move.san}`);
        }
        return true;
      } else {
        setPracticeStatus("wrong");
        setFeedbackMessage(`Incorrect move (${move.san}). Follow the ${selectedOpening?.variation || "main"} line!`);
        return false;
      }
    }

    // In Explore Mode:
    const baseFen = freeGame ? freeGame.fen() : steps[currentPly]?.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const testGame = new Chess(baseFen);

    try {
      const move = testGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (!move) return false;

      const nextStep = steps[currentPly + 1];
      if (selectedOpening && !freeGame && nextStep && (move.san === nextStep.san || (move.from === nextStep.from && move.to === nextStep.to))) {
        setCurrentPly((prev) => prev + 1);
        return true;
      }

      const activeGame = freeGame || new Chess(baseFen);
      activeGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
      setFreeGame(new Chess(activeGame.fen()));
      setExplorationMoves(activeGame.history());
      return true;
    } catch {
      return false;
    }
  };

  // Square styles & Arrows
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (mode === "practice") {
      const nextExpected = steps[practicePly + 1];
      if (hintLevel >= 1 && nextExpected) {
        styles[nextExpected.from] = {
          backgroundColor: "rgba(245, 158, 11, 0.45)",
          boxShadow: "inset 0 0 0 2px #f59e0b",
        };
      }
      return styles;
    }

    const currentStep = freeGame ? null : steps[currentPly];
    if (currentStep && currentStep.from && currentStep.to) {
      styles[currentStep.from] = {
        backgroundColor: "rgba(59, 130, 246, 0.35)",
      };
      styles[currentStep.to] = {
        backgroundColor: "rgba(59, 130, 246, 0.45)",
      };
    }

    return styles;
  }, [mode, practicePly, steps, hintLevel, freeGame, currentPly]);

  const customArrows = useMemo(() => {
    if (mode === "practice" && hintLevel >= 2) {
      const nextExpected = steps[practicePly + 1];
      if (nextExpected) {
        return [[nextExpected.from, nextExpected.to, "rgb(34, 197, 94)"] as [string, string, string]];
      }
    }
    return [];
  }, [mode, hintLevel, practicePly, steps]);

  // Group steps into move pairs for move list display
  const movePairs = useMemo(() => {
    const pairs: { moveNumber: number; white?: PlyStep; black?: PlyStep }[] = [];
    for (let i = 1; i < steps.length; i += 2) {
      const whiteStep = steps[i];
      const blackStep = steps[i + 1];
      pairs.push({
        moveNumber: whiteStep.moveNumber,
        white: whiteStep,
        black: blackStep,
      });
    }
    return pairs;
  }, [steps]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      } else if (e.key === " " && mode === "explore") {
        e.preventDefault();
        toggleAutoPlay();
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, goToPrev, goToNext, toggleAutoPlay]);

  return (
    <div className="opening-explorer-container">
      {/* Left: Board Area */}
      <div className="board-area">
        <div className="board-with-eval">
          {showEngine && <EvalBar evaluation={evaluation} />}
          <div className="board-wrapper">
            <ReactChessboard
              position={currentFen}
              onPieceDrop={onPieceDrop}
              boardOrientation={boardOrientation}
              arePiecesDraggable={mode === "explore" || (mode === "practice" && practiceStatus !== "completed")}
              customSquareStyles={customSquareStyles}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              customArrows={customArrows as any}
              animationDuration={250}
            />
          </div>
        </div>

        {/* Board Controls & Move Navigation Bar */}
        <div className="opening-controls-card" role="region" aria-label="Opening Navigation Controls">
          {mode === "explore" ? (
            <>
              {/* Stepper Controls */}
              <div className="stepper-buttons-row">
                <button
                  type="button"
                  onClick={goToStart}
                  disabled={currentPly === 0 && !freeGame}
                  className="icon-ctrl-btn"
                  title="First move (Home)"
                  aria-label="Go to start position"
                >
                  ⏮
                </button>
                <button
                  type="button"
                  onClick={goToPrev}
                  disabled={currentPly === 0 && !freeGame}
                  className="icon-ctrl-btn"
                  title="Previous move (Left arrow)"
                  aria-label="Go to previous move"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={toggleAutoPlay}
                  className={`icon-ctrl-btn play-btn ${isPlaying ? "playing" : ""}`}
                  title={isPlaying ? "Pause auto-play (Space)" : "Auto-play moves (Space)"}
                  aria-label={isPlaying ? "Pause auto play" : "Start auto play"}
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={currentPly >= steps.length - 1 || !!freeGame}
                  className="icon-ctrl-btn"
                  title="Next move (Right arrow)"
                  aria-label="Go to next move"
                >
                  ▶
                </button>
                <button
                  type="button"
                  onClick={goToEnd}
                  disabled={currentPly >= steps.length - 1 && !freeGame}
                  className="icon-ctrl-btn"
                  title="Final position (End)"
                  aria-label="Go to final position"
                >
                  ⏭
                </button>

                <div className="divider-vertical" />

                <button
                  type="button"
                  onClick={() => setBoardOrientation((prev) => (prev === "white" ? "black" : "white"))}
                  className="icon-ctrl-btn flip-btn"
                  title="Flip board (F)"
                  aria-label="Flip board orientation"
                >
                  🔄
                </button>

                <button
                  type="button"
                  onClick={() => setShowEngine((prev) => !prev)}
                  className={`icon-ctrl-btn eval-toggle-btn ${showEngine ? "active" : ""}`}
                  title="Toggle Stockfish Engine Evaluation"
                  aria-label="Toggle Stockfish Evaluation"
                >
                  ⚡
                </button>

                <button
                  type="button"
                  onClick={startUniversalExplorer}
                  className={`btn text-xs px-3 py-1.5 ml-auto ${
                    !selectedOpening && !freeGame ? "btn-primary" : "btn-secondary"
                  }`}
                  title="Explore any opening from move 1"
                >
                  🌐 Start from Move 1
                </button>
              </div>

              {/* Interactive Move Notation Pills */}
              <div className="move-notation-bar" role="navigation" aria-label="Interactive Move Sequence">
                <button
                  type="button"
                  onClick={() => jumpToPly(0)}
                  className={`move-pill ${currentPly === 0 && !freeGame ? "active" : ""}`}
                  aria-label="Start position"
                >
                  Start
                </button>

                {movePairs.map((pair) => (
                  <div key={`move-pair-${pair.moveNumber}`} className="move-pair-group">
                    <span className="move-num-label">{pair.moveNumber}.</span>
                    {pair.white && (
                      <button
                        type="button"
                        onClick={() => jumpToPly(pair.white!.ply)}
                        className={`move-pill ${
                          !freeGame && currentPly === pair.white.ply ? "active" : ""
                        }`}
                        aria-label={`Move ${pair.moveNumber} White: ${pair.white.san}`}
                      >
                        {pair.white.san}
                      </button>
                    )}
                    {pair.black && (
                      <button
                        type="button"
                        onClick={() => jumpToPly(pair.black!.ply)}
                        className={`move-pill ${
                          !freeGame && currentPly === pair.black.ply ? "active" : ""
                        }`}
                        aria-label={`Move ${pair.moveNumber} Black: ${pair.black.san}`}
                      >
                        {pair.black.san}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Free Deviation Notice if User Made Custom Moves */}
              {freeGame && (
                <div className="deviation-banner">
                  <span>
                    Current line: {explorationMoves.join(" ")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFreeGame(null);
                      setExplorationMoves([]);
                    }}
                    className="btn btn-secondary text-xs px-2.5 py-1"
                  >
                    Reset Board
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Practice Mode Banner & Actions */
            <div className="practice-controls-box">
              <div className="practice-header-status">
                <span className="font-semibold text-sm text-slate-200">
                  {practiceStatus === "completed"
                    ? "Opening Completed!"
                    : `Step ${practicePly} of ${steps.length - 1}`}
                </span>
                <span className="text-xs text-blue-400 font-mono">
                  Playing as {boardOrientation === "white" ? "⚪ White" : "⚫ Black"}
                </span>
              </div>

              {feedbackMessage && (
                <div
                  className={`practice-feedback ${
                    practiceStatus === "completed" || practiceStatus === "correct"
                      ? "success"
                      : "warning"
                  }`}
                  role="status"
                >
                  {feedbackMessage}
                </div>
              )}

              <div className="practice-actions-row">
                {practiceStatus === "completed" ? (
                  <>
                    <button
                      type="button"
                      onClick={startPractice}
                      className="btn btn-primary text-xs"
                    >
                      Practice Again
                    </button>
                    <button
                      type="button"
                      onClick={exitPractice}
                      className="btn btn-secondary text-xs"
                    >
                      Back to Explorer
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setHintLevel((prev) => Math.min(prev + 1, 2))}
                      disabled={hintLevel >= 2}
                      className="btn btn-secondary text-xs"
                      aria-label="Get move hint"
                    >
                      {hintLevel === 0 ? "💡 Show Hint" : hintLevel === 1 ? "🎯 Show Arrow" : "Max Hint"}
                    </button>
                    <button
                      type="button"
                      onClick={exitPractice}
                      className="btn btn-secondary text-xs"
                    >
                      Exit Practice
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Sidebar (Variations, Master Explorer Tree, Details) */}
      <div className="sidebar" role="region" aria-label="Openings Sidebar">
        {/* Mode Selector Pill */}
        <div className="mode-toggle-container">
          <button
            type="button"
            className={`mode-toggle-btn ${mode === "explore" ? "active" : ""}`}
            onClick={exitPractice}
            aria-pressed={mode === "explore"}
          >
            📖 Explorer
          </button>
          <button
            type="button"
            className={`mode-toggle-btn ${mode === "practice" ? "active" : ""}`}
            onClick={startPractice}
            aria-pressed={mode === "practice"}
          >
            🎯 Practice / Quiz
          </button>
        </div>

        {/* Sidebar View Tabs (Live Master Tree vs Sub-Variations vs Strategic Notes) */}
        {mode === "explore" && (
          <div className="sidebar-view-tabs" role="tablist">
            <button
              type="button"
              className={`tab-switch-btn ${sidebarTab === "masterTree" ? "active" : ""}`}
              onClick={() => setSidebarTab("masterTree")}
              role="tab"
              aria-selected={sidebarTab === "masterTree"}
            >
              🌐 Master Book
            </button>
            <button
              type="button"
              className={`tab-switch-btn ${sidebarTab === "variations" ? "active" : ""}`}
              onClick={() => setSidebarTab("variations")}
              role="tab"
              aria-selected={sidebarTab === "variations"}
            >
              🌿 Sub-Variations
            </button>
            <button
              type="button"
              className={`tab-switch-btn ${sidebarTab === "details" ? "active" : ""}`}
              onClick={() => setSidebarTab("details")}
              role="tab"
              aria-selected={sidebarTab === "details"}
            >
              💡 Strategy
            </button>
          </div>
        )}

        {/* Selected Opening Overview Header / Live Identified Opening */}
        <div className="selected-opening-badge-card">
          <div className="flex justify-between items-start gap-2">
            <div>
              <div className="text-xs font-semibold text-blue-400">
                {selectedOpening ? selectedOpening.parentOpening : "Universal Position Explorer"}
              </div>
              <h2 className="opening-card-title">
                {liveIdentifiedOpening?.name || selectedOpening?.name || "Starting Position"}
              </h2>
              <div className="opening-meta-row">
                <span className="eco-tag">
                  {liveIdentifiedOpening?.eco || selectedOpening?.eco || "A00"}
                </span>
                {selectedOpening && (
                  <span className="difficulty-tag">{selectedOpening.difficulty}</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBoardOrientation((prev) => (prev === "white" ? "black" : "white"))}
              className="flip-badge-btn"
              title="Flip board perspective"
            >
              {boardOrientation === "white" ? "⚪ View" : "⚫ View"}
            </button>
          </div>

          <div className="opening-card-moves">
            {freeGame
              ? explorationMoves.join(" ") || "Starting position"
              : selectedOpening
                ? selectedOpening.moves
                : "Starting position — make any move to explore openings"}
          </div>

          {showEngine && evaluation && (
            <div className="engine-status-box">
              <div className="status-row">
                <span className="label">Evaluation</span>
                <span className="value font-mono">{evaluation.scoreFormatted}</span>
              </div>
              {bestMove && (
                <div className="status-row">
                  <span className="label">Best Next Move</span>
                  <span className="value text-green-400 font-mono">{bestMove}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TAB 1: Live Lichess Master Tree & Candidate Moves Table (Universal across ALL Openings) */}
        {sidebarTab === "masterTree" && mode === "explore" ? (
          <div className="master-tree-container">
            <div className="master-tree-header">
              <div>
                <h3 className="master-tree-title">Universal Master Moves</h3>
                <div className="text-xs text-slate-400">
                  {liveIdentifiedOpening?.name} ({liveIdentifiedOpening?.eco})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTokenModal(true)}
                className="api-token-badge-btn"
                title="Configure Lichess Personal Access Token"
              >
                {lichessToken ? "🔑 Connected" : "⚙️ Lichess API"}
              </button>
            </div>

            {isLichessLoading ? (
              <div className="p-6 text-center text-slate-400 text-sm animate-pulse">
                Fetching master moves...
              </div>
            ) : activeTreeData && activeTreeData.moves.length > 0 ? (
              <div className="master-moves-table-wrapper">
                <div className="table-header-row">
                  <span className="col-move">Move</span>
                  <span className="col-games">Games</span>
                  <span className="col-winrate">White / Draw / Black</span>
                </div>

                <div className="master-moves-list">
                  {activeTreeData.moves.map((m) => (
                    <button
                      key={m.san}
                      type="button"
                      onClick={() => playMasterMove(m.san)}
                      className="master-move-row"
                      title={`Click to play ${m.san} (White win: ${m.whiteWinPct}%, Draw: ${m.drawPct}%, Black win: ${m.blackWinPct}%)`}
                    >
                      <span className="col-move font-bold text-blue-400 font-mono">
                        {m.san}
                      </span>
                      <span className="col-games text-xs text-slate-300 font-mono">
                        {m.totalGames.toLocaleString()}
                      </span>
                      <div className="col-winrate win-rate-bar-container">
                        <div
                          className="bar-white"
                          style={{ width: `${m.whiteWinPct}%` }}
                          title={`White: ${m.whiteWinPct}%`}
                        >
                          {m.whiteWinPct > 15 && `${m.whiteWinPct}%`}
                        </div>
                        <div
                          className="bar-draw"
                          style={{ width: `${m.drawPct}%` }}
                          title={`Draw: ${m.drawPct}%`}
                        >
                          {m.drawPct > 15 && `${m.drawPct}%`}
                        </div>
                        <div
                          className="bar-black"
                          style={{ width: `${m.blackWinPct}%` }}
                          title={`Black: ${m.blackWinPct}%`}
                        >
                          {m.blackWinPct > 15 && `${m.blackWinPct}%`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Top Master Games Section */}
                {activeTreeData.topGames && activeTreeData.topGames.length > 0 && (
                  <div className="top-games-section">
                    <h4 className="top-games-title">Top Master Games</h4>
                    <div className="top-games-list">
                      {activeTreeData.topGames.map((game, idx) => (
                        <div key={game.id || idx} className="master-game-item">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-200">
                              {game.white.name} ({game.white.rating})
                            </span>
                            <span className="text-slate-400">{game.year}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mt-0.5">
                            <span className="text-slate-300">
                              vs {game.black.name} ({game.black.rating})
                            </span>
                            <span
                              className={`font-bold font-mono ${
                                game.winner === "white"
                                  ? "text-slate-100"
                                  : game.winner === "black"
                                    ? "text-slate-400"
                                    : "text-amber-400"
                              }`}
                            >
                              {game.winner === "white"
                                ? "1-0"
                                : game.winner === "black"
                                  ? "0-1"
                                  : "½-½"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 text-sm">
                No master games found for this exact board position.
              </div>
            )}
          </div>
        ) : sidebarTab === "variations" || mode === "practice" ? (
          /* TAB 2: Sub-Variations List */
          <>
            {/* Filter Categories */}
            <div className="categories-chips-container" role="tablist" aria-label="Opening Groups">
              {PARENT_GROUPS.map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedGroup(grp)}
                  className={`category-chip ${selectedGroup === grp ? "active" : ""}`}
                  aria-selected={selectedGroup === grp}
                >
                  {grp === "All" ? "All Lines (19)" : `${grp} (${grp === "Caro-Kann" ? "9" : "10"})`}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="search-container">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sub-variations (e.g., Advance, Slav, B12)..."
                aria-label="Search chess openings"
                className="opening-search-input"
              />
            </div>

            {/* Openings Grouped List */}
            <div
              className="opening-list"
              role="list"
              aria-label="Chess Sub-Variations List"
              tabIndex={0}
            >
              {filteredOpenings.length === 0 ? (
                <div className="empty-search-state" role="status">
                  <p>No sub-variations match &quot;{searchTerm}&quot;</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedGroup("All");
                    }}
                    className="btn btn-secondary text-sm mt-2"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                Object.entries(groupedOpenings).map(([groupName, items]) => {
                  if (items.length === 0) return null;
                  return (
                    <div key={groupName} className="opening-group-section">
                      <div className="group-heading">
                        <span>{groupName}</span>
                        <span className="group-count">{items.length} lines</span>
                      </div>
                      <div className="group-items">
                        {items.map((op) => {
                          const isSelected = selectedOpening?.id === op.id;
                          return (
                            <button
                              key={op.id}
                              type="button"
                              onClick={() => handleSelectOpening(op)}
                              className={`opening-item ${isSelected ? "active" : ""}`}
                              aria-pressed={isSelected}
                              aria-label={`${op.name}, ECO code ${op.eco}`}
                            >
                              <div className="opening-name">
                                <span>{op.variation}</span>
                                <span className="eco-badge">{op.eco}</span>
                              </div>
                              <div className="opening-moves">{op.moves}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* TAB 3: Strategic Overview & Ideas */
          <div className="strategy-tab-container">
            {selectedOpening ? (
              <>
                <p className="opening-card-description">{selectedOpening.description}</p>
                <div className="key-ideas-section mt-3">
                  <h4 className="key-ideas-title">Strategic Key Ideas</h4>
                  <ul className="key-ideas-list">
                    {selectedOpening.keyIdeas.map((idea, idx) => (
                      <li key={idx}>{idea}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="p-3 text-xs text-slate-300 leading-relaxed">
                <p className="font-semibold text-slate-100 mb-1">
                  🌐 Universal Free Explorer Active
                </p>
                <p>
                  You are at Move 1. Make any opening move on the board or click
                  from the Master Book to explore grandmaster games and win
                  rates.
                </p>
                <p className="mt-2 text-slate-400">
                  To study specific strategic notes and key ideas, select a line
                  from the <strong>Sub-Variations</strong> tab.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lichess Token Modal */}
      {showTokenModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3 className="text-base font-bold text-slate-100 mb-1">
              Lichess Opening Explorer API
            </h3>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Lichess provides a free live Master Games Explorer API. You can
              optionally enter a free Lichess Personal Access Token (with
              explorer read permission) to query live master games for any
              position, or use the built-in offline master tree!
            </p>
            <input
              type="password"
              placeholder="Paste Lichess Token (e.g. lip_xxxx)..."
              value={tempToken}
              onChange={(e) => setTempToken(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 mb-3"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  saveLichessToken("");
                  setShowTokenModal(false);
                }}
                className="btn btn-secondary text-xs"
              >
                Clear / Offline Mode
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tempToken.trim()) saveLichessToken(tempToken.trim());
                  setShowTokenModal(false);
                }}
                className="btn btn-primary text-xs"
              >
                Save Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
