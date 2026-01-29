import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';

export function useChessGame() {
    const [game, setGame] = useState(new Chess());

    const makeMove = useCallback((move: string | { from: string; to: string; promotion?: string }) => {
        const gameCopy = new Chess(game.fen());
        try {
            console.log('Attempting move:', move);
            console.log('Current FEN:', game.fen());

            const result = gameCopy.move(move);

            console.log('Move result:', result);

            if (result) {
                setGame(gameCopy);
                return result;
            }
            return null;
        } catch (e) {
            console.error('Move error:', e);
            return null;
        }
    }, [game]);

    const resetGame = useCallback(() => {
        setGame(new Chess());
    }, []);

    const undoMove = useCallback(() => {
        game.undo();
        setGame(new Chess(game.fen()));
    }, [game]);

    return {
        game,
        fen: game.fen(),
        makeMove,
        resetGame,
        undoMove,
        isGameOver: game.isGameOver(),
        isCheckmate: game.isCheckmate(),
        isDraw: game.isDraw(),
        turn: game.turn(),
    };
}
