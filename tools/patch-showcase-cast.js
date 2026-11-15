// one-off: lets the showcase take its cast, timing, aim and end card from CFG (for the "Meet the Panthers Pack" video)
const fs = require('fs'), p = __dirname + '/showcase.txt';
let t = fs.readFileSync(p, 'utf8');
const T = (a, b) => { if (t.split(a).length !== 2) throw new Error('no match: ' + a); t = t.replace(a, b); };
T('const CAST = [', 'const CAST = CFG.cast || [');
T('function castIndex() { return SHOW.tour ? Math.floor(STL / (STORY / CAST.length)) % CAST.length : SHOW.pick; }',
  'const CAST_SEG = CFG.castSeg || STORY / CAST.length;               // seconds each cat is on stage\nfunction castIndex() { return SHOW.tour ? Math.min(CAST.length - 1, Math.floor(STL / CAST_SEG)) : SHOW.pick; }');
T('  if (SHOW.tour) SHOW.pickAt = Math.floor(STL / (STORY / CAST.length)) * (STORY / CAST.length);',
  '  if (SHOW.tour) SHOW.pickAt = Math.min(CAST.length - 1, Math.floor(STL / CAST_SEG)) * CAST_SEG;');
T('  setCast(castIndex());',
  '  setCast(castIndex());\n  if (CFG.aim && !SHOW.man) CAMFX = -keyVal(CFG.aim, STL) * sc / W;   // aim keys: the point on the cat (body units ahead) to centre, in any frame shape');
T("ctx.fillText('PANTHERA  ·  MEET THE CAST', x0, y0);", "ctx.fillText(CFG.castHeader || 'PANTHERA  ·  MEET THE CAST', x0, y0);");
T('  ctx.fillText(c[3], x0, y0 + S * 0.16); ctx.globalAlpha = 1;',
  `  ctx.fillText(c[3], x0, y0 + S * 0.16);
  if (c[4]) { ctx.font = \`600 \${Math.round(S * 0.034)}px "Segoe UI", system-ui, sans-serif\`; ctx.fillStyle = '#ffffff'; wrapText(c[4], x0, y0 + S * 0.225, W - x0 * 2, S * 0.045); }
  ctx.globalAlpha = 1;
  if (CFG.castEnd && STL > CAST.length * CAST_SEG) castEndCard();`);
t += `
function wrapText(txt, x, y, maxW, lh) { let line = ''; for (const w of txt.split(' ')) { const tl = line ? line + ' ' + w : w; if (ctx.measureText(tl).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = w; } else line = tl; } if (line) ctx.fillText(line, x, y); }
function castEndCard() {                                       // the closing question, inviting comments
  const k = smooth(clamp((STL - CAST.length * CAST_SEG) / 0.4)); ctx.save(); ctx.globalAlpha = k;
  ctx.fillStyle = 'rgba(8,6,16,0.6)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
  try { ctx.letterSpacing = \`\${Math.round(S * 0.004)}px\`; } catch (e) {}
  ctx.font = \`300 \${Math.round(S * 0.075)}px "Segoe UI Light", "Segoe UI", system-ui, sans-serif\`;
  const lines = CFG.castEnd.split('|'); lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.42 + i * S * 0.09));
  ctx.fillStyle = '#ffb46e'; ctx.fillRect(W / 2 - S * 0.08, H * 0.42 + lines.length * S * 0.09 - S * 0.03, S * 0.16, Math.max(2, S * 0.005));
  try { ctx.letterSpacing = '0px'; } catch (e) {} ctx.restore();
}
`;
fs.writeFileSync(p, t); console.log('patched showcase.txt');
