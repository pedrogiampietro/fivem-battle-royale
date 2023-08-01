import express from 'express';
import { PrismaClient, MatchStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../index';

const prisma = new PrismaClient();
const router = express.Router();

export enum GameType {
	SOLO = 'SOLO',
	DUO = 'DUO',
	SQUAD = 'SQUAD',
}

// Inicializando contadores de matchmaking
let matchmakingCounters: { [key in GameType]: number } = {
	SOLO: 0,
	DUO: 0,
	SQUAD: 0,
};

// No início do arquivo do servidor (antes da definição das rotas)
const matchmakingQueue: { [key in GameType]: string[] } = {
	SOLO: [],
	DUO: [],
	SQUAD: [],
};

router.post('/addPlayerToMatchmaking', async (request, response) => {
	try {
		const { userId } = request.body;
		let gameType: GameType = request.body.gameType as GameType;

		console.log(
			`Received request to add player ${userId} to matchmaking for gameType ${gameType}`
		);

		let groupId: string | undefined;

		if (gameType !== GameType.SOLO) {
			const userGroup = await prisma.groupMember.findFirst({
				where: {
					userId: userId,
				},
				select: {
					group: true,
				},
			});

			groupId = userGroup?.group?.id;

			if (!groupId) {
				return response.status(404).json({ error: "User's group not found" });
			}
		}

		let match = await prisma.match.findFirst({
			where: {
				status: MatchStatus.WAITING,
				gameType: gameType,
				groupMembers: {
					every: {
						groupId: groupId ? { not: groupId } : undefined,
					},
				},
			},
			include: {
				groupMembers: true,
			},
		});

		if (
			match &&
			gameType !== GameType.SOLO &&
			match.groupMembers.length >= (gameType === GameType.DUO ? 2 : 4)
		) {
			return response.status(400).json({ error: 'Match is already full' });
		}

		if (!match) {
			console.log(
				`No match found, creating a new match for gameType ${gameType}`
			);

			match = await prisma.match.create({
				data: {
					gameType: gameType,
					status: MatchStatus.WAITING,
				},
				include: {
					groupMembers: true,
				},
			});

			io.to(match.id).emit('player-added', {
				userId,
				gameType,
			});

			console.log(`Player ${userId} added to match ${match.id}`);
		}

		matchmakingCounters[gameType] += 1;
		io.emit('matchmakingCountersChanged', matchmakingCounters);

		if (match.groupMembers.length + 1 === 64) {
			const roomId = uuidv4(); // generate a new unique roomId

			await prisma.match.update({
				where: {
					id: match.id,
				},
				data: {
					status: MatchStatus.ONGOING,
					roomId: roomId,
				},
			});

			// Send "game started" event to all players in the match
			io.to(roomId).emit('game-started');
		}

		let groupMember;
		if (gameType !== GameType.SOLO && groupId) {
			groupMember = await prisma.groupMember.update({
				where: {
					userId_groupId: {
						userId: userId,
						groupId: groupId,
					},
				},
				data: {
					matchId: match.id,
				},
			});
		}

		return response.status(200).json({
			message: 'User added to matchmaking',
			match: match,
			groupMember: groupMember,
			error: false,
		});
	} catch (err: any) {
		console.log(`Error in addPlayerToMatchmaking: ${err.message}`);
		return response.status(500).json(err);
	}
});

router.post('/cancelMatchmaking', async (request, response) => {
	try {
		const { userId } = request.body;

		console.log(`Received request to cancel matchmaking for user ${userId}`);

		// Aqui você deve adicionar a lógica para remover o jogador da fila de matchmaking
		// e decrementar o contador de matchmaking correspondente no servidor

		// Lógica para remover o jogador da fila de matchmaking
		const gameTypeToRemoveFrom = GameType.SQUAD; // Substitua pelo tipo de jogo correto
		const playerIndex = matchmakingQueue[gameTypeToRemoveFrom].findIndex(
			(playerId) => playerId === userId
		);

		if (playerIndex !== -1) {
			matchmakingQueue[gameTypeToRemoveFrom].splice(playerIndex, 1);
		}

		// Lógica para decrementar o contador de matchmaking correspondente
		matchmakingCounters[gameTypeToRemoveFrom] =
			(matchmakingCounters[gameTypeToRemoveFrom] || 0) - 1;

		io.emit('matchmakingCountersChanged', matchmakingCounters);

		return response.status(200).json({
			message: 'Matchmaking canceled',
			error: false,
		});
	} catch (err: any) {
		console.log(`Error in cancelMatchmaking: ${err.message}`);
		return response.status(500).json(err);
	}
});

// Iniciar um jogo
router.post('/startGame', async (request, response) => {
	try {
		const { matchId } = request.body;

		// Atualizar o status do jogo para ONGOING
		const match = await prisma.match.update({
			where: {
				id: matchId,
			},
			data: {
				status: MatchStatus.ONGOING,
			},
			include: {
				groupMembers: true,
			},
		});

		// Emitir um evento de 'game-started' para o frontend
		io.emit('game-started', match.id);

		// Diminuir o contador do matchmaking
		matchmakingCounters[match.gameType] -= match.groupMembers.length;
		io.emit('matchmakingCountersChanged', matchmakingCounters);

		return response.status(200).json({
			message: 'Game started',
			error: false,
		});
	} catch (err) {
		return response.status(500).json(err);
	}
});

// Um jogador sai da fila de matchmaking
router.post('/leaveMatchmaking', async (request, response) => {
	try {
		const { userId, matchId } = request.body;

		// Remover o jogador da partida
		const groupMember = await prisma.groupMember.delete({
			where: {
				userId_groupId: {
					userId: userId,
					groupId: matchId,
				},
			},
		});

		// Emitir um evento de 'player-left' para o frontend
		io.emit('player-left', userId);

		// Precisamos buscar as informações do jogo para atualizar o contador de matchmaking
		const match = await prisma.match.findUnique({
			where: {
				id: matchId,
			},
			include: {
				groupMembers: true,
			},
		});

		if (match) {
			// Diminuir o contador do matchmaking
			matchmakingCounters[match.gameType]--;
			io.emit('matchmakingCountersChanged', matchmakingCounters);
		}

		return response.status(200).json({
			message: 'Player left matchmaking',
			error: false,
		});
	} catch (err) {
		return response.status(500).json(err);
	}
});

export default router;
