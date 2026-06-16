/**
 * Insere os vídeos demo (gravados pelo pipeline em docs/video) no Manual do Usuário.
 *
 * Rodar (a partir de docs/manual/): `bun inject-videos.mjs`
 *
 *  - Copia os clipes e o vídeo completo de ../video/output/ para assets/video/.
 *  - Embute um <video> no topo de cada página de tela (mapeada ao clipe).
 *  - Coloca o vídeo completo + lista de capítulos na página inicial (index.html).
 *  - Em "Relatórios" (sem clipe próprio) adiciona uma nota apontando para o vídeo completo.
 *
 * Idempotente: marca os blocos com data-demo-video e pula se já existirem.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIDEO_OUT = path.resolve(__dirname, '../video/output');
const ASSETS_VIDEO = path.join(__dirname, 'assets', 'video');
const PAGES = path.join(__dirname, 'pages');
const MARK = 'data-demo-video';

// ordem do vídeo: página do manual → clipe + título do capítulo
const SECTIONS = [
  { page: '01-acesso', clip: '01-login', title: 'Introdução e Acesso' },
  { page: '02-dashboard', clip: '02-dashboard', title: 'Painel Principal' },
  { page: '03-alunos', clip: '03-alunos', title: 'Cadastro de Alunos' },
  { page: '04-empresas', clip: '04-empresas', title: 'Cadastro de Empresas' },
  { page: '05-funcionarios', clip: '05-funcionarios', title: 'Cadastro de Funcionários' },
  { page: '06-questionarios', clip: '06-questionarios', title: 'Construtor de Questionários' },
  { page: '07-responder', clip: '07-responder', title: 'Responder Questionários' },
  { page: '08-respostas', clip: '08-respostas', title: 'Respostas dos Questionários' },
  { page: '09-agenda', clip: '09-agenda', title: 'Agenda e Eventos' },
  { page: '11-smtp', clip: '10-smtp', title: 'Configuração de E-mail (SMTP)' },
  // 11-outro entra só no vídeo completo (Encerramento); 10-relatorios recebe nota.
];

function probeMs(file) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nokey=1:noprint_wrappers=1', file],
    { encoding: 'utf8' },
  ).trim();
  return Math.round(parseFloat(out) * 1000);
}
const mmss = (ms) => {
  const s = Math.round(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// 1) copia os vídeos para assets/video/
if (!existsSync(ASSETS_VIDEO)) mkdirSync(ASSETS_VIDEO, { recursive: true });
const fullSrc = path.join(VIDEO_OUT, 'nexo-demo.mp4');
if (existsSync(fullSrc)) copyFileSync(fullSrc, path.join(ASSETS_VIDEO, 'nexo-demo.mp4'));
const srtSrc = path.join(VIDEO_OUT, 'nexo-demo.srt');
if (existsSync(srtSrc)) {
  copyFileSync(srtSrc, path.join(ASSETS_VIDEO, 'nexo-demo.srt'));
  // <track> HTML usa WebVTT, não SRT — converte com ffmpeg
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', srtSrc, path.join(ASSETS_VIDEO, 'nexo-demo.vtt')]);
}
for (const f of readdirSync(path.join(VIDEO_OUT, 'clips'))) {
  copyFileSync(path.join(VIDEO_OUT, 'clips', f), path.join(ASSETS_VIDEO, f));
}
console.log('[manual] vídeos copiados para assets/video/');

// helper: insere `block` imediatamente antes do primeiro <h2> do conteúdo principal
function insertBeforeContentH2(html, block) {
  const mainIdx = html.indexOf('<main class="content"');
  const h2Idx = html.indexOf('<h2', mainIdx);
  const at = html.lastIndexOf('\n', h2Idx) + 1; // início da linha do <h2>
  return html.slice(0, at) + block + html.slice(at);
}

// 2) embute o clipe em cada página de tela
for (const s of SECTIONS) {
  const file = path.join(PAGES, `${s.page}.html`);
  if (!existsSync(file)) {
    console.warn(`[manual] página ausente: ${s.page}.html`);
    continue;
  }
  let html = readFileSync(file, 'utf8');
  if (html.includes(MARK)) {
    console.log(`[manual] ${s.page}: já tem vídeo, pulando`);
    continue;
  }
  const block =
    `        <figure class="video" ${MARK}>\n` +
    `          <video controls preload="metadata" playsinline>\n` +
    `            <source src="../assets/video/${s.clip}.mp4" type="video/mp4" />\n` +
    `            Seu navegador não suporta vídeo HTML5.\n` +
    `          </video>\n` +
    `          <figcaption>🎬 Demonstração em vídeo desta tela, com narração.</figcaption>\n` +
    `        </figure>\n\n`;
  html = insertBeforeContentH2(html, block);
  writeFileSync(file, html);
  console.log(`[manual] ${s.page}: vídeo ${s.clip}.mp4 embutido`);
}

// 3) nota em Relatórios (sem clipe dedicado)
{
  const file = path.join(PAGES, '10-relatorios.html');
  if (existsSync(file)) {
    let html = readFileSync(file, 'utf8');
    if (!html.includes(MARK)) {
      const block =
        `        <figure class="video" ${MARK}>\n` +
        `          <figcaption style="border-top:none;border-bottom:1px solid var(--nexo-border)">\n` +
        `            🎬 A geração de relatórios em PDF é demonstrada ao vivo nas seções de\n` +
        `            <a href="03-alunos.html">Alunos</a>, <a href="04-empresas.html">Empresas</a> e\n` +
        `            <a href="05-funcionarios.html">Funcionários</a>. Veja também o\n` +
        `            <a href="../index.html#video-completo">vídeo completo do sistema</a>.\n` +
        `          </figcaption>\n` +
        `        </figure>\n\n`;
      html = insertBeforeContentH2(html, block);
      writeFileSync(file, html);
      console.log('[manual] 10-relatorios: nota de vídeo adicionada');
    } else {
      console.log('[manual] 10-relatorios: já tem nota, pulando');
    }
  }
}

// 4) vídeo completo + capítulos no index.html
{
  const file = path.join(__dirname, 'index.html');
  let html = readFileSync(file, 'utf8');
  if (html.includes(MARK)) {
    console.log('[manual] index: já tem vídeo, pulando');
  } else {
    // capítulos com tempos cumulativos a partir das durações dos clipes
    const order = [
      ...SECTIONS.map((s) => ({ clip: s.clip, title: s.title })),
      { clip: '11-outro', title: 'Encerramento' },
    ];
    // reordena pela sequência real do vídeo (01..11)
    order.sort((a, b) => a.clip.localeCompare(b.clip));
    let cum = 0;
    const items = order
      .map((c) => {
        const t = mmss(cum);
        cum += probeMs(path.join(ASSETS_VIDEO, `${c.clip}.mp4`));
        return `            <li><strong>${t}</strong> — ${c.title}</li>`;
      })
      .join('\n');
    const block =
      `        <figure class="video" id="video-completo" ${MARK}>\n` +
      `          <video controls preload="metadata" playsinline>\n` +
      `            <source src="assets/video/nexo-demo.mp4" type="video/mp4" />\n` +
      `            <track kind="subtitles" srclang="pt" label="Português" src="assets/video/nexo-demo.vtt" default />\n` +
      `            Seu navegador não suporta vídeo HTML5.\n` +
      `          </video>\n` +
      `          <figcaption>🎬 Tour completo do NEXO com narração (~5 min). Capítulos:\n` +
      `            <ol class="video-chapters">\n${items}\n            </ol>\n` +
      `          </figcaption>\n` +
      `        </figure>\n\n`;
    html = insertBeforeContentH2(html, block);
    writeFileSync(file, html);
    console.log('[manual] index: vídeo completo + capítulos adicionados');
  }
}

console.log('[manual] concluído.');
