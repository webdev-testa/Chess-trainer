import { useEffect, useState, useRef } from 'react';

export interface StockfishEvaluation {
  type: 'cp' | 'mate';
  value: number;
  scoreFormatted: string; // e.g. "+1.2", "-0.8", "M2", "-M1", "0.0"
  whitePercentage: number; // 0 to 100
}

export function useStockfish(fen: string, depth = 15, enabled = true) {
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<StockfishEvaluation | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const currentFenRef = useRef(fen);

  // Initialize Worker once on mount
  useEffect(() => {
    const worker = new Worker('/stockfish.js');
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const message = event.data;
      if (typeof message !== 'string') return;

      if (message.startsWith('bestmove')) {
        const move = message.split(' ')[1];
        setBestMove(move && move !== '(none)' ? move : null);
      } else if (message.startsWith('info') && message.includes('score')) {
        const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
        if (scoreMatch) {
          const type = scoreMatch[1] as 'cp' | 'mate';
          const numVal = parseInt(scoreMatch[2], 10);
          const currentFen = currentFenRef.current;
          const turn = currentFen.split(' ')[1] || 'w';

          let whitePercentage = 50;
          let scoreFormatted = '0.0';

          if (type === 'cp') {
            const whiteCp = turn === 'w' ? numVal : -numVal;
            const clampedCp = Math.max(-1000, Math.min(1000, whiteCp));
            whitePercentage = 50 + 50 * (2 / (1 + Math.exp(-0.004 * clampedCp)) - 1);
            whitePercentage = Math.max(3, Math.min(97, whitePercentage));
            const valStr = (whiteCp / 100).toFixed(1);
            scoreFormatted = whiteCp > 0 ? `+${valStr}` : valStr;
            if (scoreFormatted === '-0.0') scoreFormatted = '0.0';
          } else if (type === 'mate') {
            const whiteMate = turn === 'w' ? numVal : -numVal;
            whitePercentage = whiteMate > 0 ? 100 : 0;
            scoreFormatted = whiteMate > 0 ? `M${whiteMate}` : `-M${Math.abs(whiteMate)}`;
          }

          setEvaluation({
            type,
            value: numVal,
            scoreFormatted,
            whitePercentage: Math.round(whitePercentage * 10) / 10,
          });
        }
      }
    };

    worker.postMessage('uci');
    worker.postMessage('isready');

    return () => {
      worker.terminate();
    };
  }, []);

  // Update ref and send FEN position when fen or depth changes
  useEffect(() => {
    currentFenRef.current = fen;
    if (workerRef.current && fen && enabled) {
      workerRef.current.postMessage('stop');
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage(`go depth ${depth}`);
    }
  }, [fen, depth, enabled]);

  return { bestMove, evaluation };
}
