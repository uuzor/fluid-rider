import { createComponent, Types } from '@iwsdk/core';

export const TrackSegment = createComponent('TrackSegment', {
  length: { type: Types.Float32, default: 48 },
  index: { type: Types.Int32, default: 0 },
});

export const RacePickup = createComponent('RacePickup', {
  slot: { type: Types.Int32, default: 0 },
  collected: { type: Types.Boolean, default: false },
  respawnAt: { type: Types.Float64, default: 0 },
});

export const RaceRival = createComponent('RaceRival', {
  playerId: { type: Types.String, default: '' },
  displayName: { type: Types.String, default: 'Rival' },
  isBot: { type: Types.Boolean, default: false },
  lane: { type: Types.Float32, default: 0 },
  distance: { type: Types.Float64, default: 0 },
  stunnedUntil: { type: Types.Float64, default: 0 },
});

export const PulseShot = createComponent('PulseShot', {
  age: { type: Types.Float32, default: 0 },
  active: { type: Types.Boolean, default: false },
});
