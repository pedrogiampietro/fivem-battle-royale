import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

type Match = {
	id: string;
	gameType: string;
	status: string;
	createdAt: string;
	updatedAt: string;
	groupMembers: any[];
};

type MatchmakingResponse = {
	message: string;
	match: Match;
	groupMember: any;
	error: boolean;
};

const Matchmaking = () => {
	const [match, setMatch] = useState<Match | null>(null);
	const [socket, setSocket] = useState<Socket | null>(null);

	useEffect(() => {
		const joinMatchmaking = async () => {
			try {
				const userId = 'your-user-id'; // replace this with the real user id
				const gameType = 'SOLO'; // replace this with the real game type

				const response = await axios.post<MatchmakingResponse>(
					'http://your-server-url/addPlayerToMatchmaking',
					{ userId, gameType }
				);

				setMatch(response.data.match);

				const roomId = response.data.match.id; // Use the match id as the room id

				const socket = io('http://your-server-url', { autoConnect: false });
				setSocket(socket);

				socket.on('connect', () => {
					socket.emit('join-room', roomId);
				});

				socket.on('game-started', () => {
					console.log('Game started');
					// Navigate to your game component
				});

				socket.open();
			} catch (err) {
				console.error(err);
			}
		};

		joinMatchmaking();

		return () => {
			if (socket) {
				socket.close();
			}
		};
	}, []);

	return (
		<div>
			<h1>Matchmaking</h1>
			{match && <p>Match ID: {match.id}</p>}
		</div>
	);
};

export default Matchmaking;
