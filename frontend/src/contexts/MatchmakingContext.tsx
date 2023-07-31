import React, {
	createContext,
	useState,
	useCallback,
	useContext,
	useEffect,
	useRef,
} from 'react';
import { apiClient } from '../services/api';
import { GameType } from '../enums/GameType';

import { io, Socket } from 'socket.io-client';

interface MatchmakingContextData {
	match: any;
	setMatchmakingStatus: (status: boolean) => void;
	startMatchmaking: any;
}

interface PropsI {
	children: React.ReactNode;
}

interface UserDataI {
	avatar: string;
	createdAt: string;
	id: string;
	personaName: string;
	realName: string;
	steamId: string;
	updatedAt: string;
}

type NullableUser = UserDataI | null;

const MatchmakingContext = createContext<MatchmakingContextData>(
	{} as MatchmakingContextData
);

export const MatchmakingProvider: React.FC<PropsI> = ({ children }) => {
	const [match, setMatch] = useState<any>(null);
	const [userData, setUserData] = useState<UserDataI | null>(null);

	const socketRef = useRef<Socket | null>(null);

	const setMatchmakingStatus = useCallback(async (status: boolean) => {
		try {
			// Implement your matchmaking logic here.
			// For example, you could make a request to your backend API.
			// const response = await api.post('/matchmaking', { status });
			// setMatch(response.data);
			// For this simplified example, we just set the match to a static value
			// if (status) {
			// 	setMatch({ id: 'match-id', players: [], status: 'WAITING' });
			// } else {
			// 	setMatch(null);
			// }
		} catch (err) {
			console.error(err);
		}
	}, []);

	const startMatchmaking = useCallback(async (gameType: GameType) => {
		const getUser = localStorage.getItem('userData');
		let user: NullableUser = null;

		if (getUser) {
			user = JSON.parse(getUser);
		}

		if (!user) {
			throw new Error('You need to login before starting matchmaking');
		}

		try {
			const response = await apiClient().post(
				'/matchmaking/addPlayerToMatchmaking',
				{
					userId: user.id,
					gameType: gameType,
				}
			);

			// Analise a string JSON em `data` para obter um objeto JSON
			const parsedResponse = JSON.parse(response.data);

			// Use a propriedade `match` do objeto JSON analisado
			setMatch(parsedResponse.match);
		} catch (error) {
			console.error('Failed to start matchmaking:', error);
		}
	}, []);

	useEffect(() => {
		if (match) {
			socketRef.current = io('http://localhost:5000', {
				withCredentials: true,
			});

			// Quando o evento 'game-started' é emitido, atualize a partida
			socketRef.current.on('game-started', () => {
				// Atualize o estado da partida aqui
				console.log('O jogo começou!');
			});

			// Quando o evento 'player-added' é emitido, atualize a partida
			socketRef.current.on('player-added', (data) => {
				// Atualize o estado da partida aqui
				console.log('Um jogador foi adicionado ao matchmaking:', data);
				// Aqui você pode adicionar a lógica para atualizar o estado `match` com a nova informação
			});

			// Enviar evento 'join-room' quando um jogador inicia o matchmaking
			socketRef.current.emit('join-room', match.id);
		} else if (!match && socketRef.current) {
			socketRef.current.disconnect();
		}

		// Limpeza na desmontagem
		return () => {
			if (socketRef.current) socketRef.current.disconnect();
		};
	}, [match]);

	return (
		<MatchmakingContext.Provider
			value={{ match, setMatchmakingStatus, startMatchmaking }}
		>
			{children}
		</MatchmakingContext.Provider>
	);
};

export function useMatchmaking(): MatchmakingContextData {
	const context = useContext(MatchmakingContext);
	if (!context) {
		throw new Error('useMatchmaking must be used within a MatchmakingProvider');
	}
	return context;
}
