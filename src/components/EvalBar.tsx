import type { StockfishEvaluation } from "../hooks/useStockfish";

interface EvalBarProps {
  evaluation: StockfishEvaluation | null;
  isFlipped?: boolean;
}

export function EvalBar({ evaluation, isFlipped = false }: EvalBarProps) {
  const whitePercent = evaluation ? evaluation.whitePercentage : 50;
  const fillHeight = isFlipped ? 100 - whitePercent : whitePercent;
  const isWhiteWinning = fillHeight >= 50;
  const scoreText = evaluation ? evaluation.scoreFormatted : "0.0";

  return (
    <div
      className="eval-bar-container"
      role="progressbar"
      aria-label={`Stockfish Evaluation: ${scoreText}`}
      aria-valuenow={Math.round(fillHeight)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="eval-bar-track">
        {/* Dark (Black) Fill Top */}
        <div className="eval-bar-black">
          {!isWhiteWinning && (
            <span className="eval-score-text eval-score-black">
              {scoreText}
            </span>
          )}
        </div>

        {/* Light (White) Fill Bottom */}
        <div
          className="eval-bar-white"
          style={{ height: `${fillHeight}%` }}
        >
          {isWhiteWinning && (
            <span className="eval-score-text eval-score-white">
              {scoreText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
