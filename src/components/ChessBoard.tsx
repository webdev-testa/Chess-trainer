import { Chessboard as ReactChessboard } from "react-chessboard";
import { useCallback } from "react";
import { useChessGame } from "../hooks/useChessGame";
import { useStockfish } from "../hooks/useStockfish";
import "./ChessBoard.css";

const Chessboard = ReactChessboard as any;

export function ChessBoard() {
  const {
    game,
    makeMove,
    resetGame,
    undoMove,
    isGameOver,
    isCheckmate,
    isDraw,
    turn,
    fen,
  } = useChessGame();

  const { bestMove, evaluation } = useStockfish(fen);

  console.log("ChessBoard rendering");

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      console.log("onDrop called", sourceSquare, targetSquare);
      const moveData = {
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // Always default to queen for simplicity during testing
      };

      const result = makeMove(moveData);

      console.log("makeMove returned", result);

      // If result is null, the move was illegal (e.g., moving a pawn backwards)
      return result !== null;
    },
    [makeMove],
  );

  return (
    <div
      className="chessboard-container"
      onClick={() => console.log("Board container clicked")}
    >
      <div className="board-area">
        <div className="board-wrapper">
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            arePiecesDraggable={true}
            onPieceDragBegin={(piece: string, sourceSquare: string) => {
              console.log("Drag started", piece, sourceSquare);
              return true;
            }}
          />
        </div>
      </div>

      <div className="sidebar">
        <h2>Game Controls</h2>

        <div className="status-card">
          <div className="status-info">
            <div className="status-row">
              <span className="label">Turn</span>
              <span className="value">
                {turn === "w" ? "⚪ White" : "⚫ Black"}
              </span>
            </div>
            {evaluation && (
              <div className="status-row">
                <span className="label">Evaluation</span>
                <span className="value">{evaluation}</span>
              </div>
            )}
            {bestMove && (
              <div className="status-row">
                <span className="label">Stockfish Best</span>
                <span className="text-sm text-green-400 font-mono">
                  {bestMove}
                </span>
              </div>
            )}
          </div>

          {isGameOver && (
            <div className="game-over">
              {isCheckmate
                ? `Checkmate! ${turn === "w" ? "Black" : "White"} wins!`
                : isDraw
                  ? "Draw!"
                  : "Game Over"}
            </div>
          )}
        </div>

        <div className="controls">
          <button onClick={undoMove} className="btn btn-secondary">
            Undo
          </button>
          <button onClick={resetGame} className="btn btn-primary">
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}
