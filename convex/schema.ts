import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  rooms: defineTable({
    roomCode: v.string(),
    createdAt: v.number(),
    ownerPlayerId: v.string(),
  }).index('by_room_code', ['roomCode']),
  racers: defineTable({
    roomCode: v.string(),
    playerId: v.string(),
    playerToken: v.string(),
    displayName: v.string(),
    lane: v.number(),
    distance: v.number(),
    speed: v.number(),
    score: v.number(),
    boostCount: v.number(),
    stunnedUntil: v.number(),
    lastShotAt: v.number(),
    lastSeen: v.number(),
  })
    .index('by_room', ['roomCode'])
    .index('by_room_and_player', ['roomCode', 'playerId']),
});
