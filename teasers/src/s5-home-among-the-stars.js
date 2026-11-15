// STARDUST — EPISODE 5: the finale on the mountain. Star flowers, the northern lights and the sky panther all return for the last climb.
const T = StardustEpisode({
  name: 'HOME AMONG THE STARS', ep: 5, scene: 'peak', wake: 'starflowers', glow: '255,225,140', aurora: true, skyPanther: [2.2, 13.6],
  pal: { sky: ['#050320', '#1a1152', '#5d3d9e'], far: '#1e1754', mid: '#110c36', ground: ['#2c2564', '#0c0924'], rim: '#9d8fff', gap: '#2a1f7a', accent: '#ffe07a', accent2: '#ff9fc6', fg: '#070418' },
  moon: [0.2, 150, 120], ridge: [300, 240, 60],
  caps: [[2.2, 4.8, 'ONE LAST CLIMB'], [9.3, 12.2, 'EVERY LIGHT THEY WOKE IS WATCHING']],
  next: 'THE END  ·  FOR NOW',
  music: { root: 55, b: 0.46, mel: [5, 7, 9, null, 10, 9, 7, null, 9, 10, 12, null, 10, 9, 7, 5] },
});
