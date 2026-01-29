import { useEffect, useState, useRef } from 'react';

export function useStockfish(fen: string) {
    const [bestMove, setBestMove] = useState<string | null>(null);
    const [evaluation, setEvaluation] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize the worker directly from the public file
        // Note: stockfish.js acts as a worker itself.
        if (workerRef.current) workerRef.current.terminate();
        workerRef.current = new Worker('/stockfish.js');

        workerRef.current.onmessage = (event) => {
            const message = event.data;

            // Parse UCI protocol messages
            if (typeof message === 'string') {
                if (message.startsWith('bestmove')) {
                    const move = message.split(' ')[1];
                    setBestMove(move);
                } else if (message.startsWith('info') && message.includes('score')) {
                    // Parse score (cp or mate)
                    const parts = message.split(' ');
                    const scoreIndex = parts.findIndex((p: string) => p === 'score');
                    if (scoreIndex !== -1) {
                        const type = parts[scoreIndex + 1];
                        const val = parts[scoreIndex + 2];
                        if (type === 'cp') {
                            setEvaluation(`CP: ${val}`);
                        } else if (type === 'mate') {
                            setEvaluation(`Mate in ${val}`);
                        }
                    }
                }
            }
        };

        // Initialize engine
        workerRef.current.postMessage('uci');
        workerRef.current.postMessage('isready');

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    useEffect(() => {
        if (workerRef.current && fen) {
            // Stop previous search
            workerRef.current.postMessage('stop');
            // Set new position
            workerRef.current.postMessage(`position fen ${fen}`);
            // Start analysis (depth 15 for quick results)
            workerRef.current.postMessage('go depth 15');
        }
    }, [fen]);

    return { bestMove, evaluation };
}
