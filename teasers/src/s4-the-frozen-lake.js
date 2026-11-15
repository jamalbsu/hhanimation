// STARDUST — EPISODE 4: a frozen lake that mirrors the panther. Crystals light up and the dust wakes the northern lights.
const T = StardustEpisode({
  name: 'THE FROZEN LAKE', ep: 4, scene: 'ice', wake: 'crystals', glow: '140,240,255', aurora: 'wake', reflect: true,
  pal: { sky: ['#020e20', '#0a2a4c', '#2b6d8e'], far: '#133c5e', mid: '#0e2c48', ground: ['#86bcdb', '#2a5a80'], rim: '#eafcff', gap: '#0a2c52', accent: '#8ff4ff', accent2: '#c9b8ff', fg: '#06182a' },
  style: { hi: '#bff3ff' }, moon: [0.26, 170, 48, '#eefaff'], ridge: [260, 200, 70],
  caps: [[2.2, 4.8, 'EVEN THE ICE REMEMBERS THE STARS'], [9.3, 12.2, 'WAKE UP, NORTHERN LIGHTS!']],
  next: 'NEXT  ·  HOME AMONG THE STARS',
  music: { root: 57, b: 0.5, mel: [9, 7, null, 5, 7, null, 9, 10, 9, null, 7, 5, 7, null, 5, null] },
});
