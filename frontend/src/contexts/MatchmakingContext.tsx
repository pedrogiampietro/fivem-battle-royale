import React, {
	createContext,
	useState,
	useCallback,
	useEffect,
	useContext,
	useRef,
} from 'react';
import { apiClient } from '../services/api';
import { GameType } from '../enums/GameType';
import { Socket, io } from 'socket.io-client';

interface MatchmakingContextData {
	match: any;
	matchmakingCounters: { SOLO: number; DUO: number; SQUAD: number };
	startMatchmaking: (gameType: GameType) => Promise<void>;
	isFindingMatch: boolean;
	setIsFindingMatch: any;
	cancelMatchmaking: any;
}

interface PropsI {
	children: React.ReactNode;
}

const MatchmakingContext = createContext<MatchmakingContextData>(
	{} as MatchmakingContextData
);

export const MatchmakingProvider: React.FC<PropsI> = ({ children }) => {
	const [isFindingMatch, setIsFindingMatch] = useState(false);
	const [match, setMatch] = useState<any>(null);
	const [matchmakingCounters, setMatchmakingCounters] = useState({
		SOLO: 0,
		DUO: 0,
		SQUAD: 0,
	});
	const socketRef = useRef<Socket | null>(null);
	const isFindingMatchRef = useRef(false); // Use useRef to persist isFindingMatch across renders

	const startMatchmaking = useCallback(
		async (gameType: GameType) => {
			if (isFindingMatch) return; // Return early if already finding match

			const user = JSON.parse(localStorage.getItem('userData') || '{}');
			if (!user.id)
				throw new Error('You need to login before starting matchmaking');

			setIsFindingMatch(true);
			try {
				await new Promise<void>(
					(resolve) => setTimeout(resolve, 500) // Add a 500 ms delay before starting matchmaking
				);

				const response = await apiClient().post(
					'/matchmaking/addPlayerToMatchmaking',
					{ userId: user.id, gameType }
				);
				const parsedResponse = JSON.parse(response.data);
				setMatch(parsedResponse.match);
			} catch (error) {
				console.error('Failed to start matchmaking:', error);
			} finally {
				setIsFindingMatch(false);
			}
		},
		[isFindingMatch]
	); // Include isFindingMatch as a dependency for useCallback

	const cancelMatchmaking = useCallback(async () => {
		if (isFindingMatch || !match) return; // Return early if not finding match or match is null

		const user = JSON.parse(localStorage.getItem('userData') || '{}');
		if (!user.id)
			throw new Error('You need to login before canceling matchmaking');

		setIsFindingMatch(true);
		try {
			await new Promise<void>(
				(resolve) => setTimeout(resolve, 500) // Add a 500 ms delay before canceling matchmaking
			);

			await apiClient().post('/matchmaking/cancelMatchmaking', {
				userId: user.id,
			});
			setMatch(null);
		} catch (error) {
			console.error('Failed to cancel matchmaking:', error);
		} finally {
			setIsFindingMatch(false);
		}
	}, [isFindingMatch, match]);

	const handleSocketEvents = useCallback((socket: Socket) => {
		socket.on('game-started', (data) => console.log('Game started:', data));
		socket.on('player-added', (data) =>
			console.log('A player has been added to the match:', data)
		);
		socket.on('player-left', (data) =>
			console.log('A player has left the match:', data)
		);

		socket.on('matchmakingCountersChanged', (data) => {
			console.log('Received matchmakingCountersChanged event:', data);

			// Atualiza os contadores corretamente para cada tipo de jogo
			setMatchmakingCounters((prevCounters) => ({
				SOLO: data.SOLO !== undefined ? data.SOLO : prevCounters.SOLO,
				DUO: data.DUO !== undefined ? data.DUO : prevCounters.DUO,
				SQUAD: data.SQUAD !== undefined ? data.SQUAD : prevCounters.SQUAD,
			}));
		});
	}, []);

	useEffect(() => {
		if (match) {
			socketRef.current = io('http://localhost:5000', {
				withCredentials: true,
			});
			socketRef.current.emit('game-started', match.id);
			handleSocketEvents(socketRef.current);
		} else if (socketRef.current) {
			socketRef.current.disconnect();
			socketRef.current = null;
		}
		return () => {
			if (socketRef.current) socketRef.current.disconnect();
		};
	}, [match, handleSocketEvents]);

	return (
		<MatchmakingContext.Provider
			value={{
				match,
				matchmakingCounters,
				startMatchmaking,
				isFindingMatch,
				setIsFindingMatch,
				cancelMatchmaking,
			}}
		>
			{children}
		</MatchmakingContext.Provider>
	);
};

export function useMatchmaking(): MatchmakingContextData {
	const context = useContext(MatchmakingContext);
	if (!context)
		throw new Error('useMatchmaking must be used within a MatchmakingProvider');
	return context;
}
