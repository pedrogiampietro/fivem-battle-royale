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

let matchmakingCounters: { [key in GameType]: number } = {
	SOLO: 0,
	DUO: 0,
	SQUAD: 0,
};

const matchmakingQueue: { [key in GameType]: string[] } = {
	SOLO: [],
	DUO: [],
	SQUAD: [],
};

router.post('/addPlayerToMatchmaking', async (request, response) => {
	try {
		console.log('Starting matchmaking...');

		const { players, gameType: rawGameType } = request.body;
		const gameType = rawGameType as GameType;

		console.log('Starting matchmaking...');
		console.log('Received players for matchmaking:', request.body.players);

		if (!matchmakingQueue[gameType]) {
			throw new Error('Invalid gameType provided.');
		}

		players.forEach((player: any) =>
			matchmakingQueue[gameType].push(player.id)
		);

		const groupId = await getGroupIdForUser(players[0].id, gameType);
		let match = await findOrCreateMatch(players[0].id, gameType, groupId);

		for (const player of players) {
			await createGroupMemberForMatch(player.id, match.id, groupId);
		}

		// Adjusted this line
		matchmakingCounters[gameType] += players.length;
		io.emit('matchmakingCountersChanged', matchmakingCounters);

		if (
			match.groupMembers &&
			match.groupMembers.length + players.length === 64
		) {
			const roomId = uuidv4();
			await prisma.match.update({
				where: { id: match.id },
				data: { status: MatchStatus.ONGOING, roomId },
			});
			io.to(roomId).emit('game-started');
		}

		const refreshedMatch = await prisma.match.findFirst({
			where: { id: match.id },
			include: { groupMembers: true },
		});

		console.log('Final state of the match after processing:', refreshedMatch);
		return response
			.status(200)
			.json({ message: 'User added to matchmaking', match });
	} catch (err: any) {
		console.error(`Error in addPlayerToMatchmaking: ${err.message}`);
		return response.status(500).json({ error: err.message });
	}
});

async function getGroupIdForUser(
	userId: string,
	gameType: GameType
): Promise<string | null> {
	if (gameType === GameType.SOLO) {
		console.log('Solo game type detected. No groupId needed.');
		return null;
	}

	const userGroup = await prisma.groupMember.findFirst({
		where: { userId },
		select: { groupId: true },
	});

	console.log("User's associated groupId:", userGroup?.groupId);

	if (!userGroup?.groupId) {
		throw new Error("User's group not found");
	}
	return userGroup.groupId;
}

async function findOrCreateMatch(
	userId: string,
	gameType: GameType,
	groupId: string | null
) {
	let match = await prisma.match.findFirst({
		where: {
			status: MatchStatus.WAITING,
			gameType,
			NOT: { groupMembers: { some: { userId } } },
			groupMembers: {
				every: { groupId: groupId ? { not: groupId } : undefined },
			},
		},
		include: { groupMembers: true },
	});

	if (match) {
		console.log('Found existing match:', match);
	} else {
		console.log('No match found. Creating new match...');
	}

	if (match) return match;

	match = await prisma.match.create({
		data: { gameType, status: MatchStatus.WAITING },
		include: { groupMembers: true },
	});
	io.to(match.id).emit('player-added', { userId, gameType });
	return match;
}

async function createGroupMemberForMatch(
	userId: string,
	matchId: string,
	groupId: string | null
) {
	// Check if the record already exists for this user and match
	const existingGroupMember = await prisma.groupMember.findFirst({
		where: { userId, matchId },
	});

	if (existingGroupMember) {
		console.log(
			`Existing group member detected for userId: ${userId}, matchId: ${matchId}`
		);
		return;
	} else {
		console.log(
			`No existing group member found for userId: ${userId}, matchId: ${matchId}`
		);
	}

	if (!groupId) {
		console.log('GroupId not provided. Fetching default solo group...');
		groupId = await getDefaultSoloGroupId();
	}

	// Check if the user is already a member of the groupId
	const isMemberOfGroup = await prisma.groupMember.findUnique({
		where: {
			userId_groupId: {
				userId: userId,
				groupId: groupId,
			},
		},
	});

	if (isMemberOfGroup) {
		// If the user is already a member of the group, just update the matchId
		console.log(
			`Updating group member for userId: ${userId}, matchId: ${matchId}, groupId: ${groupId}`
		);
		await prisma.groupMember.update({
			where: {
				userId_groupId: {
					userId: userId,
					groupId: groupId,
				},
			},
			data: {
				matchId: matchId,
			},
		});
	} else {
		console.log(
			`Creating new group member for userId: ${userId}, matchId: ${matchId}, groupId: ${groupId}`
		);
		await prisma.groupMember.create({
			data: {
				userId,
				matchId,
				groupId,
			},
		});
	}
}

async function getDefaultSoloGroupId(): Promise<string> {
	let defaultSoloGroup = await prisma.group.findFirst({
		where: { name: 'Default Solo Group' },
	});

	if (defaultSoloGroup) return defaultSoloGroup.id;

	defaultSoloGroup = await prisma.group.create({
		data: { name: 'Default Solo Group' },
	});
	return defaultSoloGroup.id;
}

router.post('/cancelMatchmaking', async (request, response) => {
	try {
		const { userId } = request.body;
		let gameType: GameType = request.body.gameType as GameType;

		if (!matchmakingQueue[gameType]) {
			return response.status(400).json({ error: 'Invalid gameType provided.' });
		}

		const playerIndex = matchmakingQueue[gameType].findIndex(
			(playerId) => playerId === userId
		);

		if (playerIndex !== -1) {
			matchmakingQueue[gameType].splice(playerIndex, 1);
			matchmakingCounters[gameType] -= 1;
			io.emit('matchmakingCountersChanged', matchmakingCounters);
		} else {
			console.log(
				`User with ID ${userId} was not found in matchmaking queue for gameType ${gameType}`
			);
		}

		// Retrieve the Match IDs associated with the user and game type through GroupMember
		const associatedMatches = await prisma.groupMember.findMany({
			where: {
				userId: userId,
				match: {
					gameType: gameType,
					status: 'WAITING',
				},
			},
			select: {
				matchId: true,
			},
		});

		const matchIds = associatedMatches
			.map((match) => match.matchId)
			.filter((id) => id !== null) as string[];

		console.log('Match IDs to be deleted:', matchIds);

		// Delete groupMembers associated with the matches
		const deleteGroupMemberResult = await prisma.groupMember.deleteMany({
			where: {
				userId: userId,
				matchId: {
					in: matchIds,
				},
			},
		});

		console.log(
			`GroupMember Delete Result for userId ${userId} and gameType ${gameType}:`,
			deleteGroupMemberResult
		);

		// Actual Deletion of matches
		const deleteResult = await prisma.match.deleteMany({
			where: {
				id: {
					in: matchIds,
				},
			},
		});

		console.log(
			`Match Delete Result for userId ${userId} and gameType ${gameType}:`,
			deleteResult
		);

		if (deleteResult.count === 0) {
			console.log(
				'No matches were deleted. Investigate the conditions and the current state of the database.'
			);
		}

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
