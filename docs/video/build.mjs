/**
 * Etapa 3 do pipeline de vídeo: MONTA o vídeo final com ffmpeg.
 *
 * Rodar (a partir de frontend/): `bun run video:build`
 *
 * Para cada seção (na ordem de narration.ts) que tenha um webm em raw/:
 *  1. Encaixa o áudio de cada cena no offset real (timeline.json) sobre uma
 *     base de silêncio do tamanho do vídeo (adelay + amix) — sincronia por cena.
 *  2. Muxa o webm (re-encode H.264) com esse áudio → output/clips/<key>.mp4.
 * Depois:
 *  3. Concatena todos os clipes → output/nexo-demo.mp4.
 *  4. Reembute capítulos (1 por seção) com timestamps cumulativos.
 *  5. Gera output/nexo-demo.srt (legendas) a partir do roteiro + timeline.
 *
 * Sem durations.json/áudio (edge-tts não rodou): produz vídeo mudo + SRT sidecar.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS, SCENES } from './narration.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO = path.join(__dirname, 'audio');
const RAW = path.join(__dirname, 'raw');
const OUT = path.join(__dirname, 'output');
const CLIPS = path.join(OUT, 'clips');
const TMP = path.join(OUT, '.tmp');
const DURATIONS = path.join(__dirname, 'durations.json');
const TIMELINE = path.join(__dirname, 'timeline.json');
const FINAL = path.join(OUT, 'nexo-demo.mp4');
const SRT = path.join(OUT, 'nexo-demo.srt');

for (const d of [CLIPS, TMP]) {
  if (existsSync(d)) rmSync(d, { recursive: true, force: true });
  mkdirSync(d, { recursive: true });
}

const durations = existsSync(DURATIONS) ? JSON.parse(readFileSync(DURATIONS, 'utf8')) : {};
const timeline = existsSync(TIMELINE) ? JSON.parse(readFileSync(TIMELINE, 'utf8')) : {};
const textOf = Object.fromEntries(SCENES.map((s) => [s.id, s.text]));

function ff(args) {
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'pipe', 'inherit'] });
}
function probeMs(file) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nokey=1:noprint_wrappers=1', file],
    { encoding: 'utf8' },
  ).trim();
  return Math.round(parseFloat(out) * 1000);
}

// ---- monta 1 clipe (vídeo + áudio sincronizado) por seção --------------------
function buildClip(section) {
  const webm = path.join(RAW, `${section.key}.webm`);
  if (!existsSync(webm)) {
    console.warn(`[build] sem webm para ${section.key} — pulando`);
    return null;
  }
  const videoMs = probeMs(webm);
  const clip = path.join(CLIPS, `${section.key}.mp4`);

  // cenas com áudio existente, com offset (timeline) ou sequencial (fallback)
  const tl = timeline[section.key]?.scenes ?? [];
  const offsetById = Object.fromEntries(tl.map((s) => [s.id, s.startMs]));
  let seqCursor = 0;
  const clips = [];
  for (const sc of section.scenes) {
    const mp3 = path.join(AUDIO, `${sc.id}.mp3`);
    if (!existsSync(mp3)) continue;
    const dur = durations[sc.id] ?? probeMs(mp3);
    const startMs = offsetById[sc.id] ?? seqCursor;
    seqCursor = startMs + dur + 200;
    clips.push({ mp3, startMs });
  }

  const baseArgs = ['-i', webm];
  const vCodec = ['-map', '0:v', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-preset', 'medium', '-r', '25'];
  const common = ['-movflags', '+faststart'];

  if (clips.length === 0) {
    // sem áudio → vídeo mudo
    ff([...baseArgs, ...vCodec, '-an', ...common, clip]);
  } else {
    const inputs = [...baseArgs, '-f', 'lavfi', '-t', String(videoMs / 1000), '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100'];
    for (const c of clips) inputs.push('-i', c.mp3);
    // input 0 = webm, 1 = base silêncio, 2..N = mp3s
    const labels = [];
    const parts = [];
    clips.forEach((c, i) => {
      const inIdx = 2 + i;
      parts.push(`[${inIdx}]adelay=${c.startMs}|${c.startMs}[a${i}]`);
      labels.push(`[a${i}]`);
    });
    const filter = `${parts.join(';')};[1]${labels.join('')}amix=inputs=${clips.length + 1}:normalize=0:duration=longest[aout]`;
    ff([
      ...inputs,
      '-filter_complex', filter,
      ...vCodec,
      '-map', '[aout]',
      '-c:a', 'aac', '-b:a', '160k', '-ar', '44100',
      '-shortest',
      ...common,
      clip,
    ]);
  }
  console.log(`[build] clipe ${section.key}.mp4 (${(videoMs / 1000).toFixed(1)}s, ${clips.length} cenas com voz)`);
  return clip;
}

// ---- helpers de tempo (SRT / capítulos) --------------------------------------
function srtTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const x = ms % 1000;
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(h)}:${p(m)}:${p(s)},${p(x, 3)}`;
}

// =============================================================================
console.log('[build] montando clipes por seção…');
const built = [];
for (const section of SECTIONS) {
  const clip = buildClip(section);
  if (clip) built.push({ section, clip, durMs: probeMs(clip) });
}
if (built.length === 0) {
  console.error('[build] nenhum clipe gerado (rode video:record antes). Abortando.');
  process.exit(1);
}

// ---- concat de todos os clipes ----------------------------------------------
const listFile = path.join(TMP, 'concat.txt');
writeFileSync(listFile, built.map((b) => `file '${b.clip.replace(/'/g, "'\\''")}'`).join('\n'));
const concatMp4 = path.join(TMP, 'concat.mp4');
ff(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-movflags', '+faststart', concatMp4]);

// ---- capítulos (1 por seção) -------------------------------------------------
let meta = ';FFMETADATA1\n';
let cum = 0;
for (const b of built) {
  const start = cum;
  const end = cum + b.durMs;
  meta += `[CHAPTER]\nTIMEBASE=1/1000\nSTART=${start}\nEND=${end}\ntitle=${b.section.title}\n`;
  cum = end;
}
const metaFile = path.join(TMP, 'chapters.txt');
writeFileSync(metaFile, meta);
ff(['-i', concatMp4, '-i', metaFile, '-map_metadata', '1', '-map_chapters', '1', '-c', 'copy', '-movflags', '+faststart', FINAL]);

// ---- legendas SRT (a partir do roteiro + offsets reais) ----------------------
let srt = '';
let idx = 1;
let base = 0;
for (const b of built) {
  const tl = timeline[b.section.key]?.scenes ?? [];
  const offsetById = Object.fromEntries(tl.map((s) => [s.id, s.startMs]));
  let seq = 0;
  for (const sc of b.section.scenes) {
    const dur = durations[sc.id] ?? 4000;
    const startMs = offsetById[sc.id] ?? seq;
    seq = startMs + dur + 200;
    const gStart = base + startMs;
    const gEnd = Math.min(base + b.durMs, gStart + dur);
    srt += `${idx++}\n${srtTime(gStart)} --> ${srtTime(gEnd)}\n${textOf[sc.id] ?? ''}\n\n`;
  }
  base += b.durMs;
}
writeFileSync(SRT, srt);

rmSync(TMP, { recursive: true, force: true });

const totalMin = (cum / 1000 / 60).toFixed(1);
console.log(`\n[build] ✅ pronto:`);
console.log(`  • ${path.relative(process.cwd(), FINAL)}  (${totalMin} min, ${built.length} capítulos)`);
console.log(`  • ${path.relative(process.cwd(), SRT)}  (legendas)`);
console.log(`  • ${path.relative(process.cwd(), CLIPS)}/  (${built.length} clipes por seção)`);
