import { useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import openingsData from "../data/openings.json";
import "./ChessBoard.css";
import "./OpeningExplorer.css";

export function OpeningExplorer() {
  const [selectedOpening, setSelectedOpening] = useState(openingsData[0]);
  const [game, setGame] = useState(new Chess(openingsData[0].fen));

  function handleSelect(opening: any) {
    setSelectedOpening(opening);
    setGame(new Chess(opening.fen));
  }

  return (
    <div className="opening-explorer-container">
      {/* Left: Board Area */}
      <div className="board-area">
        <div className="board-wrapper">
          {/* @ts-ignore */}
          <Chessboard position={game.fen()} />
        </div>
        <div className="opening-details-overlay">
          <div className="opening-detail-name">{selectedOpening.name}</div>
          <div className="opening-detail-eco">ECO: {selectedOpening.eco}</div>
        </div>
      </div>

      {/* Right: Sidebar (List) */}
      <div className="sidebar">
        <h2 className="opening-title">Opening Explorer</h2>
        <div className="opening-list">
          {openingsData.map((op) => (
            <div
              key={op.eco}
              onClick={() => handleSelect(op)}
              className={`opening-item ${
                selectedOpening.eco === op.eco ? "active" : ""
              }`}
            >
              <div className="opening-name">
                {op.name} ({op.eco})
              </div>
              <div className="opening-moves">{op.moves}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
