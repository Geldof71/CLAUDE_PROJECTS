// Neemt de holomap rondleiding op als video, scene voor scene.
// De pagina draait op een virtuele klok: elk frame schuift de tijd precies
// 1/FPS seconde op, zodat de opname vloeiend is hoe traag de render ook is.
//
// Gebruik: node opname.js <holomap/index.html> <map met vo wavs> <uitvoermap> [maxFrames]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [htmlPath, voDir, outDir, maxFramesArg] = process.argv.slice(2);
const FPS = 30, W = 1280, H = 720;
const maxFrames = maxFramesArg ? Number(maxFramesArg) : Infinity;
const scenes = JSON.parse(fs.readFileSync(path.join(__dirname, 'scenes.json'), 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

function wavSeconds(file) {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());
}

const VIRTUAL_CLOCK = `(() => {
  let vt = 0, rafQ = [], timers = [], tid = 1;
  const d0 = Date.now();
  performance.now = () => vt;
  Date.now = () => d0 + vt;
  window.requestAnimationFrame = cb => { rafQ.push(cb); return rafQ.length; };
  window.cancelAnimationFrame = () => {};
  window.setTimeout = (fn, ms, ...a) => { const id = tid++; timers.push({ id, t: vt + (ms || 0), fn, a }); return id; };
  window.clearTimeout = id => { timers = timers.filter(x => x.id !== id); };
  window.__step = ms => {
    vt += ms;
    for (let due; (due = timers.filter(x => x.t <= vt)).length;) {
      timers = timers.filter(x => x.t > vt);
      due.sort((a, b) => a.t - b.t).forEach(x => { if (typeof x.fn === 'function') x.fn(...x.a); });
    }
    // css transities en animaties volgen ook de virtuele klok
    document.getAnimations().forEach(an => {
      if (an.__vt0 === undefined) { an.__vt0 = vt - ms; an.pause(); }
      an.currentTime = vt - an.__vt0;
    });
    const q = rafQ; rafQ = [];
    q.forEach(cb => cb(vt));
  };
})();`;

// bediening en uitleg voor muis en toetsen horen niet in de video
const CLEAN_CSS = `#ctrl,#pad,#wexit,#lookhint,#cross,#wh,#wb,#adesc{display:none!important}`;

(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', e => console.error('paginafout:', e.message));
  await page.addInitScript(VIRTUAL_CLOCK);
  await page.goto('file://' + path.resolve(htmlPath));
  await page.addStyleTag({ content: CLEAN_CSS });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => { for (let i = 0; i < 30; i++) window.__step(1000 / 30); });

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', path.join(outDir, 'beeld.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });

  let frame = 0;
  async function shoot(n) {
    for (let i = 0; i < n && frame < maxFrames; i++) {
      await page.evaluate(ms => window.__step(ms), 1000 / FPS);
      const img = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(img)) await new Promise(r => ff.stdin.once('drain', r));
      frame++;
      if (frame % 150 === 0) console.log(`frame ${frame} (${(frame / FPS).toFixed(1)} s)`);
    }
  }
  const cardVisible = () => page.evaluate(() => !document.getElementById('walkcard').hidden);
  async function untilCard(limitS) {
    for (let t = 0; t < limitS * FPS && frame < maxFrames; t++) {
      if (await cardVisible()) return;
      await shoot(1);
    }
  }

  async function act(a) {
    if (a.startsWith('hold:')) return shoot(Math.round(Number(a.slice(5)) * FPS));
    if (a === 'spin') return page.evaluate(() => { const b = document.getElementById('spin'); if (b.getAttribute('aria-pressed') !== 'true') b.click(); });
    if (a === 'reset') return page.evaluate(() => document.getElementById('reset').click());
    if (a === 'walk') { await page.evaluate(() => document.getElementById('walkbtn').click()); await shoot(15); return untilCard(20); }
    const ok = await page.evaluate(label => {
      const b = [...document.querySelectorAll('#wb button')].find(x => x.textContent === label);
      if (b) b.click();
      return !!b;
    }, a);
    if (!ok) throw new Error('knop niet gevonden: ' + a);
    await shoot(2);
    return untilCard(20);
  }

  const timeline = [];
  for (const sc of scenes) {
    const start = frame / FPS;
    const vo = path.join(voDir, sc.id + '.wav');
    const voLen = wavSeconds(vo);
    const voStart = start + 0.35;
    for (const a of sc.actions) await act(a);
    // de scene duurt minstens tot de voice over klaar is, plus een korte adempauze
    const end = Math.max(frame / FPS + 0.5, voStart + voLen + 0.6);
    await shoot(Math.round(end * FPS) - frame);
    timeline.push({ id: sc.id, start, voStart, voLen, end: frame / FPS });
    console.log(sc.id, start.toFixed(2), (frame / FPS).toFixed(2));
    if (frame >= maxFrames) break;
  }

  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  fs.writeFileSync(path.join(outDir, 'tijdlijn.json'), JSON.stringify(timeline, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
