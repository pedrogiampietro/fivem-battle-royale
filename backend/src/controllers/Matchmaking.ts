import express from "express";
import { PrismaClient, MatchStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { io } from "../index";

const prisma = new PrismaClient();
const router = express.Router();

export enum GameType {
  SOLO = "SOLO",
  DUO = "DUO",
  SQUAD = "SQUAD",
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

router.post("/addPlayerToMatchmaking", async (request, response) => {
  try {
    const { players, gameType: rawGameType } = request.body;
    const gameType = rawGameType as GameType;

    if (!matchmakingQueue[gameType]) {
      throw new Error("Invalid gameType provided.");
    }

    players.forEach((player: any) =>
      matchmakingQueue[gameType].push(player.id)
    );

    const groupId = await getGroupIdForUser(players[0].id, gameType);
    let match = await findOrCreateMatch(players[0].id, gameType, groupId);

    for (const player of players) {
      await createGroupMemberForMatch(player.id, match.id, groupId);
    }

    matchmakingCounters[gameType] += players.length;
    io.emit("matchmakingCountersChanged", matchmakingCounters);

    if (
      match.groupMembers &&
      match.groupMembers.length + players.length === 64
    ) {
      const roomId = uuidv4();
      await prisma.match.update({
        where: { id: match.id },
        data: { status: MatchStatus.ONGOING, roomId },
      });
      io.to(roomId).emit("game-started");
    }

    const refreshedMatch = await prisma.match.findFirst({
      where: { id: match.id },
      include: { groupMembers: true },
    });

    return response
      .status(200)
      .json({ message: "User added to matchmaking", match });
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
    console.error("Solo game type detected. No groupId needed.");
    return null;
  }

  const userGroup = await prisma.groupMember.findFirst({
    where: { userId },
    select: { groupId: true },
  });

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

  if (match) return match;

  match = await prisma.match.create({
    data: { gameType, status: MatchStatus.WAITING },
    include: { groupMembers: true },
  });
  io.to(match.id).emit("player-added", { userId, gameType });
  return match;
}

async function createGroupMemberForMatch(
  userId: string,
  matchId: string,
  groupId: string | null
) {
  if (!groupId) {
    groupId = await getDefaultSoloGroupId();
  }

  const isMemberOfGroup = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: userId,
        groupId: groupId,
      },
    },
  });

  if (isMemberOfGroup) {
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
    where: { name: "Default Solo Group" },
  });

  if (defaultSoloGroup) return defaultSoloGroup.id;

  defaultSoloGroup = await prisma.group.create({
    data: { name: "Default Solo Group" },
  });
  return defaultSoloGroup.id;
}

router.post("/cancelMatchmaking", async (request, response) => {
  try {
    const { userId } = request.body;
    let gameType: GameType = request.body.gameType as GameType;

    if (!matchmakingQueue[gameType]) {
      return response.status(400).json({ error: "Invalid gameType provided." });
    }

    const playerIndex = matchmakingQueue[gameType].findIndex(
      (playerId) => playerId === userId
    );

    if (playerIndex !== -1) {
      matchmakingQueue[gameType].splice(playerIndex, 1);
      matchmakingCounters[gameType] -= 1;
      io.emit("matchmakingCountersChanged", matchmakingCounters);
    }

    const associatedMatches = await prisma.groupMember.findMany({
      where: {
        userId: userId,
        match: {
          gameType: gameType,
          status: "WAITING",
        },
      },
      select: {
        matchId: true,
      },
    });

    const matchIds = associatedMatches
      .map((match) => match.matchId)
      .filter((id) => id !== null) as string[];

    const deleteGroupMemberResult = await prisma.groupMember.deleteMany({
      where: {
        userId: userId,
        matchId: {
          in: matchIds,
        },
      },
    });

    const deleteResult = await prisma.match.deleteMany({
      where: {
        id: {
          in: matchIds,
        },
      },
    });

    return response.status(200).json({
      message: "Matchmaking canceled",
      error: false,
    });
  } catch (err: any) {
    console.error(`Error in cancelMatchmaking: ${err.message}`);
    return response.status(500).json(err);
  }
});

router.post("/startGame", async (request, response) => {
  try {
    const { matchId } = request.body;

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

    io.emit("game-started", match.id);

    matchmakingCounters[match.gameType] -= match.groupMembers.length;
    io.emit("matchmakingCountersChanged", matchmakingCounters);

    return response.status(200).json({
      message: "Game started",
      error: false,
    });
  } catch (err) {
    return response.status(500).json(err);
  }
});

router.post("/leaveMatchmaking", async (request, response) => {
  try {
    const { userId, matchId } = request.body;

    io.emit("player-left", userId);

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },
      include: {
        groupMembers: true,
      },
    });

    if (match) {
      matchmakingCounters[match.gameType]--;
      io.emit("matchmakingCountersChanged", matchmakingCounters);
    }

    return response.status(200).json({
      message: "Player left matchmaking",
      error: false,
    });
  } catch (err) {
    return response.status(500).json(err);
  }
});

export default router;
