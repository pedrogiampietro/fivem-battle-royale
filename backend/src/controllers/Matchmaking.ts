import express from 'express';
import { PrismaClient, GameType, MatchStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../index';

const prisma = new PrismaClient();
const router = express.Router();

router.post('/addPlayerToMatchmaking', async (request, response) => {
	try {
		const { userId, gameType } = request.body;

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
		}

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
			// Replace this comment with your real-time communication code

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
	} catch (err) {
		return response.status(500).json(err);
	}
});

export default router;
