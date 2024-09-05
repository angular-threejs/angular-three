import { computed, signal } from '@angular/core';

export const tracks = [
  { sound: 'drums', positionZ: 0.25 },
  { sound: 'synth', positionZ: -0.25 },
  { sound: 'snare', positionZ: 0 },
] as const;

export const zoomIndex = signal(Math.floor(Math.random() * tracks.length));
export const zoomTrack = computed(() => tracks[zoomIndex()].sound);
