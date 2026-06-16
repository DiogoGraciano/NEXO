/**
 * Etapa 1 do pipeline de vídeo: gera a narração TTS.
 *
 * Rodar (a partir de frontend/): `bun ../docs/video/generate-tts.mjs`
 *
 *  - Lê o roteiro de narration.ts (fonte única).
 *  - Para cada cena: gera audio/<id>.mp3 (+ .vtt) com edge-tts (voz PT-BR neural).
 *  - Mede a duração de cada mp3 com ffprobe e grava durations.json (ms).
 *  - Idempotente: pula cenas cujo texto+voz não mudaram (hash em manifest.json).
 *
 * Requisitos: edge-tts no PATH (~/.local/bin), ffprobe (ffmpeg), internet.
 * Voz configurável via env VIDEO_VOICE (padrão pt-BR-FranciscaNeural).
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENES } from './narration.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.join(__dirname, 'audio');
const DURATIONS = path.join(__dirname, 'durations.json');
const MANIFEST = path.join(AUDIO_DIR, 'manifest.json');

const VOICE = process.env.VIDEO_VOICE ?? 'pt-BR-FranciscaNeural';
// ~/.local/bin (onde o pip --user instalou o edge-tts) precisa estar no PATH.
const ENV = { ...process.env, PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}` };

if (!existsSync(AUDIO_DIR)) mkdirSync(AUDIO_DIR, { recursive: true });

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};

function hashOf(text) {
  return createHash('sha1').update(`${VOICE}::${text}`).digest('hex');
}

function probeDurationMs(file) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nokey=1:noprint_wrappers=1', file],
    { encoding: 'utf8', env: ENV },
  ).trim();
  return Math.round(parseFloat(out) * 1000);
}

function tts(text, mp3, vtt) {
  execFileSync(
    'edge-tts',
    ['--voice', VOICE, '--text', text, '--write-media', mp3, '--write-subtitles', vtt],
    { stdio: ['ignore', 'ignore', 'inherit'], env: ENV },
  );
}

const durations = {};
let generated = 0;
let skipped = 0;

console.log(`[tts] voz: ${VOICE} — ${SCENES.length} cenas`);

for (const scene of SCENES) {
  const mp3 = path.join(AUDIO_DIR, `${scene.id}.mp3`);
  const vtt = path.join(AUDIO_DIR, `${scene.id}.vtt`);
  const h = hashOf(scene.text);

  if (existsSync(mp3) && manifest[scene.id] === h) {
    durations[scene.id] = probeDurationMs(mp3);
    skipped++;
    continue;
  }

  process.stdout.write(`[tts] gerando ${scene.id}… `);
  tts(scene.text, mp3, vtt);
  durations[scene.id] = probeDurationMs(mp3);
  manifest[scene.id] = h;
  generated++;
  console.log(`OK (${durations[scene.id]} ms)`);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
writeFileSync(DURATIONS, JSON.stringify(durations, null, 2));

const totalMs = Object.values(durations).reduce((a, b) => a + b, 0);
console.log(
  `[tts] concluído: ${generated} geradas, ${skipped} reaproveitadas. ` +
    `Narração total ≈ ${(totalMs / 1000 / 60).toFixed(1)} min. → durations.json`,
);
