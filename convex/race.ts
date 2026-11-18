import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const MAX_PLAYERS = 8;
const STALE_AFTER_MS = 15_000;
const ROOM_LIFETIME_MS = 12 * 60 * 60 * 1000;
const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/u;
const PLAYER_ID_PATTERN = /^[\w-]{16,64}$/u;
const TOKEN_PATTERN = /^[\w-]{32,80}$/u;

function normalizeRoomCode(roomCode: string): string {
  const normalized = roomCode.trim().toUpperCase();
  if (!ROOM_CODE_PATTERN.test(normalized)) {
    throw new Error('Room codes must be six letters or numbers.');
  }
  return normalized;
}

function validateIdentity(playerId: string, playerToken: string): void {
  if (!PLAYER_ID_PATTERN.test(playerId) || !TOKEN_PATTERN.test(playerToken)) {
    throw new Error('Invalid rider session.');
  }
}

function cleanDisplayName(displayName: string): string {
  const cleaned = displayName.replace(/[<>\u0000-\u001f]/gu, '').trim().slice(0, 18);
  if (cleaned.length === 0) {
    throw new Error('Enter a rider name between 1 and 18 characters.');
  }
  return cleaned;
}

function validateSnapshot(args: {
  lane: number;
  distance: number;
  speed: number;
  score: number;
  boostCount: number;
}): void {
  if (
    !Number.isFinite(args.lane) || args.lane < -1 || args.lane > 1 ||
    !Number.isFinite(args.distance) || args.distance < 0 || args.distance > 100_000_000 ||
    !Number.isFinite(args.speed) || args.speed < 0 || args.speed > 72 ||
    !Number.isInteger(args.score) || args.score < 0 || args.score > 1_000_000_000 ||
    !Number.isInteger(args.boostCount) || args.boostCount < 0 || args.boostCount > 100_000
  ) {
    throw new Error('Rider state is outside the allowed range.');
  }
}

export const createRoom = mutation({
  args: {
    roomCode: v.string(),
    playerId: v.string(),
    playerToken: v.string(),
    displayName: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const roomCode = normalizeRoomCode(args.roomCode);
    validateIdentity(args.playerId, args.playerToken);
    const displayName = cleanDisplayName(args.displayName);
    const existingRoom = await ctx.db
      .query('rooms')
      .withIndex('by_room_code', (q) => q.eq('roomCode', roomCode))
      .unique();
    if (existingRoom) {
      throw new Error('That room code is already in use. Create another room.');
    }

    const now = Date.now();
    await ctx.db.insert('rooms', {
      roomCode,
      createdAt: now,
      ownerPlayerId: args.playerId,
    });
    await ctx.db.insert('racers', {
      roomCode,
      playerId: args.playerId,
      playerToken: args.playerToken,
      displayName,
      lane: 0,
      distance: 0,
      speed: 0,
      score: 0,
      boostCount: 0,
      stunnedUntil: 0,
      lastShotAt: 0,
      lastSeen: now,
    });
    return roomCode;
  },
});

export const joinRoom = mutation({
  args: {
    roomCode: v.string(),
    playerId: v.string(),
    playerToken: v.string(),
    displayName: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const roomCode = normalizeRoomCode(args.roomCode);
    validateIdentity(args.playerId, args.playerToken);
    const displayName = cleanDisplayName(args.displayName);
    const now = Date.now();
    const room = await ctx.db
      .query('rooms')
      .withIndex('by_room_code', (q) => q.eq('roomCode', roomCode))
      .unique();
    if (!room || now - room.createdAt > ROOM_LIFETIME_MS) {
      throw new Error('Room not found or expired. Check the code or create a new room.');
    }

    const roomRacers = await ctx.db
      .query('racers')
      .withIndex('by_room', (q) => q.eq('roomCode', roomCode))
      .collect();
    for (const racer of roomRacers) {
      if (now - racer.lastSeen > STALE_AFTER_MS) {
        await ctx.db.delete(racer._id);
      }
    }

    const existing = await ctx.db
      .query('racers')
      .withIndex('by_room_and_player', (q) =>
        q.eq('roomCode', roomCode).eq('playerId', args.playerId),
      )
      .unique();
    if (existing && existing.playerToken !== args.playerToken) {
      throw new Error('This rider id is already in the room.');
    }
    const activeCount = roomRacers.filter((racer) => now - racer.lastSeen <= STALE_AFTER_MS).length;
    if (!existing && activeCount >= MAX_PLAYERS) {
      throw new Error('This room is full.');
    }

    const racerData = {
      displayName,
      lane: existing?.lane ?? 0,
      distance: existing?.distance ?? 0,
      speed: existing?.speed ?? 0,
      score: existing?.score ?? 0,
      boostCount: existing?.boostCount ?? 0,
      stunnedUntil: existing?.stunnedUntil ?? 0,
      lastShotAt: existing?.lastShotAt ?? 0,
      lastSeen: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, racerData);
    } else {
      await ctx.db.insert('racers', {
        roomCode,
        playerId: args.playerId,
        playerToken: args.playerToken,
        ...racerData,
      });
    }
    return roomCode;
  },
});

export const listRacers = query({
  args: { roomCode: v.string() },
  returns: v.array(v.object({
    playerId: v.string(),
    displayName: v.string(),
    lane: v.number(),
    distance: v.number(),
    speed: v.number(),
    score: v.number(),
    boostCount: v.number(),
    stunnedUntil: v.number(),
    lastSeen: v.number(),
  })),
  handler: async (ctx, args) => {
    const roomCode = normalizeRoomCode(args.roomCode);
    const now = Date.now();
    const racers = await ctx.db
      .query('racers')
      .withIndex('by_room', (q) => q.eq('roomCode', roomCode))
      .collect();
    return racers
      .filter((racer) => now - racer.lastSeen <= STALE_AFTER_MS)
      .map((racer) => ({
        playerId: racer.playerId,
        displayName: racer.displayName,
        lane: racer.lane,
        distance: racer.distance,
        speed: racer.speed,
        score: racer.score,
        boostCount: racer.boostCount,
        stunnedUntil: racer.stunnedUntil,
        lastSeen: racer.lastSeen,
      }));
  },
});

export const updateRacer = mutation({
  args: {
    roomCode: v.string(),
    playerId: v.string(),
    playerToken: v.string(),
    lane: v.number(),
    distance: v.number(),
    speed: v.number(),
    score: v.number(),
    boostCount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const roomCode = normalizeRoomCode(args.roomCode);
    validateIdentity(args.playerId, args.playerToken);
    validateSnapshot(args);
    const racer = await ctx.db
      .query('racers')
      .withIndex('by_room_and_player', (q) =>
        q.eq('roomCode', roomCode).eq('playerId', args.playerId),
      )
      .unique();
    if (!racer || racer.playerToken !== args.playerToken) {
      throw new Error('Rider session not found. Rejoin the room.');
    }

    const now = Date.now();
    if (now - racer.lastSeen < 150) {
      throw new Error('Rider updates are arriving too quickly.');
    }
    await ctx.db.patch(racer._id, {
      lane: args.lane,
      distance: Math.max(racer.distance, Math.min(args.distance, racer.distance + 20)),
      speed: args.speed,
      score: Math.max(racer.score, Math.min(args.score, racer.score + 500)),
      boostCount: Math.max(racer.boostCount, Math.min(args.boostCount, racer.boostCount + 1)),
      lastSeen: now,
    });
    return null;
  },
});

export const fireShot = mutation({
  args: {
    roomCode: v.string(),
    playerId: v.string(),
    playerToken: v.string(),
    targetPlayerId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const roomCode = normalizeRoomCode(args.roomCode);
    validateIdentity(args.playerId, args.playerToken);
    if (!PLAYER_ID_PATTERN.test(args.targetPlayerId) || args.targetPlayerId === args.playerId) {
      return false;
    }
    const shooter = await ctx.db
      .query('racers')
      .withIndex('by_room_and_player', (q) =>
        q.eq('roomCode', roomCode).eq('playerId', args.playerId),
      )
      .unique();
    const target = await ctx.db
      .query('racers')
      .withIndex('by_room_and_player', (q) =>
        q.eq('roomCode', roomCode).eq('playerId', args.targetPlayerId),
      )
      .unique();
    const now = Date.now();
    if (
      !shooter || shooter.playerToken !== args.playerToken ||
      !target || now - shooter.lastSeen > STALE_AFTER_MS || now - target.lastSeen > STALE_AFTER_MS ||
      Math.abs(target.distance - shooter.distance) > 24 || now - shooter.lastShotAt < 800
    ) {
      return false;
    }

    await ctx.db.patch(shooter._id, { lastShotAt: now, lastSeen: now });
    await ctx.db.patch(target._id, { stunnedUntil: now + 1_400 });
    return true;
  },
});

export const leaveRoom = mutation({
  args: {
    roomCode: v.string(),
    playerId: v.string(),
    playerToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const roomCode = normalizeRoomCode(args.roomCode);
    validateIdentity(args.playerId, args.playerToken);
    const racer = await ctx.db
      .query('racers')
      .withIndex('by_room_and_player', (q) =>
        q.eq('roomCode', roomCode).eq('playerId', args.playerId),
      )
      .unique();
    if (racer && racer.playerToken === args.playerToken) {
      await ctx.db.delete(racer._id);
    }
    return null;
  },
});
