import express from 'express';
import { PrismaClient } from '@prisma/client';
import { io, userSockets } from '../index';

const prisma = new PrismaClient();
const router = express.Router();

enum GameType {
	SOLO = 'SOLO',
	DUO = 'DUO',
	SQUAD = 'SQUAD',
}

router.get('/', async (req, res) => {
	try {
		return res.status(200).json({
			message: 'Player left matchmaking',
			error: false,
		});
	} catch (err) {
		return res.status(500).json(err);
	}
});

// Fetch all groups
router.get('/findAll', async (req, res) => {
	try {
		const groups = await prisma.group.findMany();
		res.json(groups);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch groups.' });
	}
});

// Fetch a specific group by ID
router.get('/:id', async (req, res) => {
	try {
		const groupId = req.params.id;
		const group = await prisma.group.findUnique({
			where: {
				id: groupId,
			},
			include: {
				groupMembers: true,
			},
		});
		if (!group) {
			return res.status(404).json({ error: 'Group not found.' });
		}
		res.json(group);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch group.' });
	}
});

router.get('/users/search', async (req, res) => {
	try {
		const query = req.query.username as string;

		if (!query) {
			return res
				.status(400)
				.json({ error: 'You must provide a search query.' });
		}

		const users = await prisma.user.findMany({
			where: {
				personaName: {
					contains: query,
					mode: 'insensitive', // This ensures a case-insensitive search
				},
			},
		});

		return res.status(200).json({
			message: `${users.length} Jogadores encontrados`,
			users: users,
			error: false,
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to search users.' });
	}
});

//@@ Rota para criar um novo convite: Nesta rota, um usuário (inviter) envia um convite para outro usuário (invited) para se juntar a um grupo.
router.post('/invite', async (req, res) => {
	try {
		const { inviterUserId, invitedUserId } = req.body;

		const inviter = await prisma.user.findUnique({
			where: { id: inviterUserId },
		});

		if (!inviter) {
			res.status(404).json({ error: 'Inviter not found.' });
			return;
		}

		const groupName = `Grupo do ${inviter.personaName}`;

		let group =
			(await prisma.group.findFirst({
				where: { name: groupName },
			})) ||
			(await prisma.group.create({
				data: { name: groupName },
			}));

		if (!group) {
			throw new Error(
				'Unexpected error occurred while creating or finding group.'
			);
		}

		const isInviterAMember = await prisma.groupMember.findUnique({
			where: { userId_groupId: { userId: inviterUserId, groupId: group.id } },
		});

		if (!isInviterAMember) {
			await prisma.groupMember.create({
				data: {
					userId: inviterUserId,
					groupId: group.id,
					owner: true,
				},
			});
		}

		const invite = await prisma.invite.create({
			data: {
				groupId: group.id,
				invitedUserId: invitedUserId,
				inviterUserId: inviterUserId,
			},
		});

		if (!invite) {
			throw new Error('Failed to send invite.');
		}

		const socketId = userSockets.get(invitedUserId);

		// Emitir o evento de convite para o usuário convidado
		if (socketId) {
			io.to(socketId).emit('invite', {
				message: {
					groupId: group.id,
					inviterName: inviter.personaName,
					groupName: group.name,
					inviteId: invite.id,
				},
			});
		} else {
			res.status(404).send('User not found.');
		}

		res.json({ message: 'Invite sent successfully!', groupId: group.id });
	} catch (error: any) {
		console.error('Error handling invite:', error);
		res
			.status(500)
			.json({ error: error.message || 'Failed to handle invite.' });
	}
});

//@@ Rota para aceitar um convite: Nesta rota, o usuário convidado (invited) aceita o convite para se juntar a um grupo.
router.put('/invite/accept/:inviteId', async (req, res) => {
	try {
		const inviteId = req.params.inviteId;

		const invite = await prisma.invite.findUnique({
			where: { id: inviteId },
		});

		if (!invite) {
			return res.status(404).json({ error: 'Invite not found.' });
		}

		if (invite.status !== 'PENDING') {
			return res.status(400).json({ error: 'This invite is not pending.' });
		}

		await prisma.invite.update({
			where: { id: inviteId },
			data: { status: 'ACCEPTED' },
		});

		await prisma.groupMember.create({
			data: {
				userId: invite.invitedUserId,
				groupId: invite.groupId,
			},
		});

		const groupId = invite.groupId;
		if (groupId) {
			// Obtenha todos os membros do grupo
			const groupMembers = await prisma.groupMember.findMany({
				where: {
					groupId: groupId,
				},
				include: {
					user: true,
				},
			});

			// Get user data
			const user = await prisma.user.findUnique({
				where: {
					id: invite.invitedUserId,
				},
			});

			if (!user) {
				return res.status(404).send('User data not found.');
			}

			// Emita o evento 'playerJoined' para cada membro do grupo

			groupMembers.forEach((member) => {
				const socketId = userSockets.get(member.userId);
				if (socketId) {
					io.to(socketId).emit('playerJoined', {
						message: {
							user: {
								id: user.id,
								personaName: user.personaName,
								avatar: user.avatar,
							},
							groupMembers: groupMembers.map((member) => ({
								id: member.userId,
								name: member.user.personaName,
								avatar: member.user.avatar,
								owner: member.owner,
							})),
							groupId: groupId,
						},
					});
				}
			});

			res.json({
				message: 'Invite accepted and user added to the group.',
				userData: user,
			});
		} else {
			res.status(404).send('User not found.');
		}
	} catch (error) {
		res.status(500).json({ error: 'Failed to accept invite.' });
	}
});

//@@ Rota para recusar um convite: Nesta rota, o usuário convidado (invited) recusa o convite.
router.put('/invite/decline/:inviteId', async (req, res) => {
	try {
		const inviteId = req.params.inviteId;

		const invite = await prisma.invite.findUnique({
			where: { id: inviteId },
		});

		if (!invite) {
			return res.status(404).json({ error: 'Invite not found.' });
		}

		if (invite.status !== 'PENDING') {
			return res.status(400).json({ error: 'This invite is not pending.' });
		}

		await prisma.invite.update({
			where: { id: inviteId },
			data: { status: 'DECLINED' },
		});

		res.json({ message: 'Invite declined.' });
	} catch (error) {
		res.status(500).json({ error: 'Failed to decline invite.' });
	}
});

//@@ Rota para obter todos os convites pendentes de um usuário:
router.get('/invites/:userId', async (req, res) => {
	try {
		const { userId } = req.params;

		const pendingInvites = await prisma.invite.findMany({
			where: {
				invitedUserId: userId,
				status: 'PENDING',
			},
			include: {
				inviterUser: true,
				group: true,
			},
		});

		res.json(pendingInvites);
	} catch (error: any) {
		console.error('Error fetching invites:', error);
		res
			.status(500)
			.json({ error: error.message || 'Failed to fetch invites.' });
	}
});

//@@ Rota para setar um tipo de partida no grupo
router.put('/setGameType/:groupId', async (req, res) => {
	try {
		const { gameType } = req.body;
		const { groupId } = req.params;

		if (!Object.values(GameType).includes(gameType)) {
			return res.status(400).json({ error: 'Invalid game type.' });
		}

		const updatedGroup = await prisma.group.update({
			where: { id: groupId },
			data: { gameType: gameType },
		});

		res.json({ message: 'Game type set successfully!', group: updatedGroup });
	} catch (error: any) {
		console.error('Error setting game type:', error);
		res
			.status(500)
			.json({ error: error.message || 'Failed to set game type.' });
	}
});

//@@ Rota para listar os jogadores de um grupo a partir do usuario logado
router.get('/groupOfUser/:userId', async (req, res) => {
	try {
		const { userId } = req.params;

		const groupMemberEntry = await prisma.groupMember.findFirst({
			where: {
				userId: userId,
			},
			include: {
				group: {
					include: {
						groupMembers: {
							include: {
								user: true,
							},
						},
					},
				},
			},
		});

		if (!groupMemberEntry || !groupMemberEntry.group) {
			return res.status(404).json({ error: 'User is not in any group.' });
		}

		const group = groupMemberEntry.group;
		const memberCount = group.groupMembers.length;

		// Lista de jogadores no grupo
		const players = group.groupMembers.map((member: any) => ({
			id: member.user.id,
			name: member.user.personaName,
			avatar: member.user.avatar,
			owner: member.owner,
		}));

		res.json({
			group: {
				id: group.id,
				name: group.name,
				gameType: group.gameType,
				memberCount: memberCount,
				players: players,
			},
		});
	} catch (error: any) {
		console.error('Error fetching group of user:', error);
		res
			.status(500)
			.json({ error: error.message || 'Failed to fetch group of user.' });
	}
});

//@@ Rota para remover um jogador de um grupo
router.delete('/removeFromGroup', async (req, res) => {
	try {
		const { userId, groupId } = req.body;

		// Verificar se o usuário é membro do grupo
		const groupMember = await prisma.groupMember.findUnique({
			where: {
				userId_groupId: { userId, groupId },
			},
		});

		if (!groupMember) {
			return res
				.status(404)
				.json({ error: 'User is not a member of this group.' });
		}

		// Remover o usuário do grupo
		await prisma.groupMember.delete({
			where: {
				userId_groupId: { userId, groupId },
			},
		});

		res.json({ message: 'User removed from the group successfully.' });
	} catch (error: any) {
		console.error('Error removing user from group:', error);
		res
			.status(500)
			.json({ error: error.message || 'Failed to remove user from group.' });
	}
});

export default router;
