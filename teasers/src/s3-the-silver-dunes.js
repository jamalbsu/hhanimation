// STARDUST — EPISODE 3: a moonlit desert. The dust rises and a second panther made of stars runs beside them in the sky.
const T = StardustEpisode({
  name: 'THE SILVER DUNES', ep: 3, scene: 'dunes', wake: 'footstars', glow: '255,220,150', skyPanther: [8.8, 13.4],
  pal: { sky: ['#140a2c', '#44225f', '#b55c7e'], far: '#3b1e54', mid: '#2a1440', ground: ['#5d3869', '#22112d'], rim: '#dfa6ad', gap: '#3d2c80', accent: '#ffd98a', accent2: '#ffb38a', fg: '#12071c' },
  moon: [-0.22, 190, 105], ridge: [120, 420, 0],
  caps: [[2.2, 4.8, 'IN THE DESERT, THE SKY RUNS TOO'], [9.3, 12.2, 'NO ONE RUNS ALONE']],
  next: 'NEXT  ·  THE FROZEN LAKE',
  music: { root: 65, b: 0.52, mel: [7, null, 5, 7, 9, null, 7, 5, 4, null, 5, 7, 5, 4, 2, null] },
});
