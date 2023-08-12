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
	loading: any;
}

interface PropsI {
	children: React.ReactNode;
}

const MatchmakingContext = createContext<MatchmakingContextData>(
	{} as MatchmakingContextData
);

export const MatchmakingProvider: React.FC<PropsI> = ({ children }) => {
	const [isFindingMatch, setIsFindingMatch] = useState(false);
	const [loading, setLoading] = useState(false);
	const [match, setMatch] = useState<any>(null);
	const [matchmakingCounters, setMatchmakingCounters] = useState({
		SOLO: 0,
		DUO: 0,
		SQUAD: 0,
	});
	const socketRef = useRef<Socket | null>(null);

	const startMatchmaking = async (gameType: any) => {
		const user = JSON.parse(localStorage.getItem('userData') || '{}');
		console.log('user', user);

		if (!user.id)
			throw new Error('You need to login before starting matchmaking');

		console.log('Iniciando matchmaking para:', gameType);
		setLoading(true); // Inicia o loading

		try {
			// Lógica para iniciar o matchmaking
			// Chama a API do servidor para adicionar o jogador ao matchmaking
			const response = await apiClient().post(
				'/matchmaking/addPlayerToMatchmaking',
				{
					userId: user.id,
					gameType,
				}
			);

			console.log('Resposta da API para iniciar matchmaking:', response.data);

			if (response.data && !response.data.error) {
				setIsFindingMatch(true);
			} else {
				// Tratar erro aqui, se necessário
			}
		} catch (err: any) {
			console.log('Erro ao chamar API:', err.message);

			// Tratar erros de rede ou outros erros aqui
		} finally {
			setLoading(false); // Finaliza o loading
		}
	};

	const cancelMatchmaking = async (gameType: any) => {
		const user = JSON.parse(localStorage.getItem('userData') || '{}');

		if (!user.id)
			throw new Error('You need to login before starting matchmaking');

		console.log('Cancelando matchmaking.');

		setLoading(true); // Inicia o loading
		try {
			// Lógica para cancelar o matchmaking
			// Chama a API do servidor para remover o jogador do matchmaking
			const response = await apiClient().post(
				'/matchmaking/cancelMatchmaking',
				{
					userId: user.id,
					gameType,
				}
			);

			console.log('Resposta da API para cancelar matchmaking:', response.data);

			if (response.data && !response.data.error) {
				setIsFindingMatch(false);
			} else {
				// Tratar erro aqui, se necessário.
			}
		} catch (err: any) {
			console.log('Erro ao chamar API:', err.message);

			// Tratar erros de rede ou outros erros aqui
		} finally {
			setLoading(false); // Finaliza o loading
		}
	};

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
		console.log('Establishing socket connection.');

		// Estabelecendo conexão com o socket
		socketRef.current = io('http://localhost:5000', {
			withCredentials: true,
		});

		// Ouvindo eventos
		handleSocketEvents(socketRef.current);

		// Se o match é definido, emitimos o 'game-started' evento
		if (match) {
			socketRef.current.emit('game-started', match.id);
			console.log('Emitting game-started with match id:', match.id);
		}

		// Limpando o socket na desmontagem
		return () => {
			console.log('Disconnecting socket.');
			if (socketRef.current) {
				socketRef.current.disconnect();
				socketRef.current = null;
			}
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
				loading,
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
