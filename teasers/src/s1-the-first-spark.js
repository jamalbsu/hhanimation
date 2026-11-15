// STARDUST — EPISODE 1: a star falls into a night meadow and chooses the panther as its friend. Flowers bloom where they run.
const T = StardustEpisode({
  name: 'THE FIRST SPARK', ep: 1, scene: 'meadow', wake: 'flowers', glow: '255,150,200', meteor: true, buddyAt: 6.6,
  pal: { sky: ['#0a0f2e', '#22386c', '#6272b4'], far: '#1c2b58', mid: '#131f48', ground: ['#17364c', '#0a1828'], rim: '#4a8f7a', gap: '#1e4a8a', accent: '#ff9fc6', accent2: '#ffd98a' },
  moon: [0.24, 200, 62], ridge: [150, 310, 0],
  caps: [[2.2, 4.8, 'ONE NIGHT, A STAR FELL…'], [9.3, 12.2, '…AND CHOSE A FRIEND']],
  next: 'NEXT  ·  THE SLEEPING FOREST',
  music: { root: 60, b: 0.5, mel: [5, null, 7, 6, 5, null, 4, 5, 7, null, 9, 7, 6, 5, 4, null] },
});
