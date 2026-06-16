/**
 * Etapa 2 do pipeline de vídeo: GRAVA a demonstração (1 webm por seção).
 *
 * Rodar (a partir de frontend/): `bun run video:record`
 *
 * Cada seção do roteiro (narration.ts) vira um test() que cria seu próprio
 * BrowserContext com recordVideo. As ações de UID são "pausadas" pelo helper
 * scene(): cada cena espera no mínimo a duração da sua narração (durations.json),
 * de modo que a fala caiba na imagem. Os offsets reais de cada cena são gravados
 * em timeline.json, e o build.mjs encaixa o áudio no tempo certo.
 *
 * Como o vídeo do Playwright NÃO mostra o cursor real, injetamos um cursor
 * "fake" via addInitScript para a demonstração ficar legível.
 *
 * Tolerante a falhas: cada ação é best-effort (safe()); se um clique falhar a
 * narração continua e a seção segue. CRUD destrutivo roda no banco e2e descartável.
 */
import { test, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS } from '../../../docs/video/narration';
import { fillField, fieldByLabel } from '../helpers/forms';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIDEO_DIR = path.resolve(__dirname, '../../../docs/video');
const RAW = path.join(VIDEO_DIR, 'raw');
const RAW_TMP = path.join(VIDEO_DIR, '.rawtmp');
const DURATIONS = path.join(VIDEO_DIR, 'durations.json');
const TIMELINE = path.join(VIDEO_DIR, 'timeline.json');
const ADMIN_STATE = path.resolve(__dirname, '../.auth/admin.json');

const VIEWPORT = { width: 1920, height: 1080 };
const MIN_DWELL = 2600; // dwell mínimo por cena mesmo sem áudio (ms)
const FALLBACK = 4500; // duração assumida quando não há durations.json

// preserva raw/ entre execuções (saveAs sobrescreve por seção) — permite
// re-gravar uma única seção via `-g`. Só o diretório temporário é limpo.
if (existsSync(RAW_TMP)) rmSync(RAW_TMP, { recursive: true, force: true });
mkdirSync(RAW_TMP, { recursive: true });
if (!existsSync(RAW)) mkdirSync(RAW, { recursive: true });

const durations: Record<string, number> = existsSync(DURATIONS)
  ? JSON.parse(readFileSync(DURATIONS, 'utf8'))
  : {};
const timeline: Record<string, { title: string; scenes: { id: string; startMs: number }[]; durationMs: number }> =
  existsSync(TIMELINE) ? JSON.parse(readFileSync(TIMELINE, 'utf8')) : {};

function sectionTitle(key: string) {
  return SECTIONS.find((s) => s.key === key)?.title ?? key;
}

// ---- geradores de documentos válidos (passam na validação de CPF/CNPJ) -------
const rnd = (n: number) => Math.floor(Math.random() * n);
function validCPF(): string {
  const d: number[] = Array.from({ length: 9 }, () => rnd(10));
  let s = 0;
  for (let i = 0; i < 9; i++) s += d[i]! * (10 - i);
  let r = s % 11;
  d.push(r < 2 ? 0 : 11 - r);
  s = 0;
  for (let i = 0; i < 10; i++) s += d[i]! * (11 - i);
  r = s % 11;
  d.push(r < 2 ? 0 : 11 - r);
  return `${d.slice(0, 3).join('')}.${d.slice(3, 6).join('')}.${d.slice(6, 9).join('')}-${d.slice(9).join('')}`;
}
function validCNPJ(): string {
  const d: number[] = [...Array.from({ length: 8 }, () => rnd(10)), 0, 0, 0, 1];
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let s = 0;
  for (let i = 0; i < 12; i++) s += d[i]! * w1[i]!;
  let r = s % 11;
  d.push(r < 2 ? 0 : 11 - r);
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  s = 0;
  for (let i = 0; i < 13; i++) s += d[i]! * w2[i]!;
  r = s % 11;
  d.push(r < 2 ? 0 : 11 - r);
  return `${d.slice(0, 2).join('')}.${d.slice(2, 5).join('')}.${d.slice(5, 8).join('')}/${d.slice(8, 12).join('')}-${d.slice(12).join('')}`;
}
function dtLocal(daysAhead: number, hour: number): string {
  const dd = new Date();
  dd.setDate(dd.getDate() + daysAhead);
  dd.setHours(hour, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${dd.getFullYear()}-${p(dd.getMonth() + 1)}-${p(dd.getDate())}T${p(dd.getHours())}:${p(dd.getMinutes())}`;
}

// ---- cursor fake (vídeo do Playwright não renderiza o ponteiro real) ---------
const CURSOR_SCRIPT = `
(() => {
  if (window.__cursorInstalled) return;
  window.__cursorInstalled = true;
  const add = () => {
    if (document.getElementById('__demo_cursor')) return;
    const c = document.createElement('div');
    c.id = '__demo_cursor';
    c.style.cssText = [
      'position:fixed','left:-50px','top:-50px','width:22px','height:22px',
      'border-radius:50%','background:rgba(37,99,235,.45)','border:2px solid #2563eb',
      'box-shadow:0 0 0 4px rgba(37,99,235,.15)','pointer-events:none','z-index:2147483647',
      'transform:translate(-50%,-50%)','transition:width .08s,height .08s,background .08s'
    ].join(';');
    document.body.appendChild(c);
  };
  const move = (e) => {
    const c = document.getElementById('__demo_cursor'); if (!c) return;
    c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px';
  };
  const down = () => { const c = document.getElementById('__demo_cursor'); if (c){ c.style.width='14px'; c.style.height='14px'; c.style.background='rgba(37,99,235,.8)'; } };
  const up = () => { const c = document.getElementById('__demo_cursor'); if (c){ c.style.width='22px'; c.style.height='22px'; c.style.background='rgba(37,99,235,.45)'; } };
  window.addEventListener('mousemove', move, true);
  window.addEventListener('mousedown', down, true);
  window.addEventListener('mouseup', up, true);
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
  new MutationObserver(add).observe(document.documentElement, { childList: true, subtree: false });
})();
`;

// =============================================================================
// Runner de seção
// =============================================================================
type SceneFn = (id: string, actions: () => Promise<void>) => Promise<void>;

async function runSection(
  browser: Browser,
  key: string,
  opts: { authenticated: boolean },
  body: (page: Page, scene: SceneFn) => Promise<void>,
) {
  const ctx: BrowserContext = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    storageState: opts.authenticated ? ADMIN_STATE : undefined,
    recordVideo: { dir: RAW_TMP, size: VIEWPORT },
    extraHTTPHeaders: { 'x-e2e': '1' },
  });
  ctx.on('dialog', (d) => d.accept().catch(() => {}));
  const page = await ctx.newPage();
  await page.addInitScript(CURSOR_SCRIPT);

  const sceneLog: { id: string; startMs: number }[] = [];
  const tStart = Date.now();

  const scene: SceneFn = async (id, actions) => {
    const t0 = Date.now();
    sceneLog.push({ id, startMs: t0 - tStart });
    try {
      await actions();
    } catch (e) {
      console.warn(`[rec] cena ${id} ação falhou: ${(e as Error).message}`);
    }
    const spent = Date.now() - t0;
    const need = Math.max(MIN_DWELL, durations[id] ?? FALLBACK) + 250; // +respiro
    const extra = need - spent;
    if (extra > 0) await page.waitForTimeout(extra);
  };

  try {
    await body(page, scene);
  } catch (e) {
    console.warn(`[rec] seção ${key} interrompida: ${(e as Error).message}`);
  }

  const durationMs = Date.now() - tStart;
  await ctx.close(); // finaliza o vídeo
  const dest = path.join(RAW, `${key}.webm`);
  await page.video()?.saveAs(dest);
  await page.video()?.delete().catch(() => {});

  timeline[key] = { title: sectionTitle(key), scenes: sceneLog, durationMs };
  writeFileSync(TIMELINE, JSON.stringify(timeline, null, 2));
  console.log(`[rec] seção ${key} OK → raw/${key}.webm (${(durationMs / 1000).toFixed(1)}s)`);
}

// ---- utilitários de UI -------------------------------------------------------
async function safe(label: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    console.warn(`[rec] skip ${label}: ${(e as Error).message}`);
  }
}
async function smoothScroll(page: Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), top);
  await page.waitForTimeout(700);
}
async function typeInto(page: Page, locator: ReturnType<Page['getByLabel']>, text: string) {
  await locator.click();
  await locator.fill('');
  await locator.pressSequentially(text, { delay: 35 });
}
async function chooseSelect(page: Page, labelRx: RegExp, optIndex = 1) {
  const sel = fieldByLabel(page, labelRx);
  await sel.waitFor({ state: 'visible', timeout: 4000 });
  const opts = await sel.locator('option').all();
  if (opts.length > optIndex) {
    const v = await opts[optIndex]!.getAttribute('value');
    if (v) await sel.selectOption(v);
  }
}
async function selectValue(page: Page, labelRx: RegExp, value: string) {
  const sel = fieldByLabel(page, labelRx);
  await sel.waitFor({ state: 'visible', timeout: 4000 });
  await sel.selectOption(value);
}
async function clickByName(page: Page, rx: RegExp) {
  await page.getByRole('button', { name: rx }).first().click();
}
async function cancelModal(page: Page) {
  await page.getByRole('button', { name: /cancelar|fechar/i }).first().click().catch(() => {});
  await page.waitForTimeout(300);
}

test.describe.configure({ mode: 'serial' });

// =============================================================================
// 01 — INTRODUÇÃO E ACESSO  (sem autenticação)
// =============================================================================
test('01-login', async ({ browser }) => {
  await runSection(browser, '01-login', { authenticated: false }, async (page, scene) => {
    await scene('01-intro', async () => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle').catch(() => {});
    });

    await scene('01-login-form', async () => {
      await typeInto(page, page.getByLabel(/e-?mail/i), 'admin@nexo.com');
      await typeInto(page, page.getByLabel(/senha/i), 'admin123');
    });

    await scene('01-login-erro', async () => {
      await page.getByLabel(/senha/i).fill('senha-incorreta');
      await clickByName(page, /^entrar$/i);
      await page.waitForTimeout(1500);
    });

    await scene('01-forgot', async () => {
      await page.goto('/forgot-password');
      await page.waitForLoadState('networkidle').catch(() => {});
      await safe('forgot-fill', async () => {
        await typeInto(page, page.getByLabel(/e-?mail/i), 'admin@nexo.com');
        await page.getByRole('button', { name: /enviar|recuperar|solicitar/i }).first().click();
        await page.waitForTimeout(2200);
      });
    });

    await scene('01-reset', async () => {
      await safe('reset-via-mailpit', async () => {
        const res = await page.request.get('http://localhost:8025/api/v1/messages?limit=1');
        if (!res.ok()) return;
        const data = await res.json();
        const msgId = data?.messages?.[0]?.ID;
        if (!msgId) return;
        const msg = await (await page.request.get(`http://localhost:8025/api/v1/message/${msgId}`)).json();
        const body = String(msg?.HTML || msg?.Text || '');
        const m = body.match(/token=([A-Za-z0-9._-]+)/);
        if (!m) return;
        await page.goto(`/reset-password?token=${m[1]}`);
        await page.waitForLoadState('networkidle').catch(() => {});
        await fillField(page, /^senha$|nova senha/i, 'admin123').catch(() => {});
        await fillField(page, /confirmar|repita/i, 'admin123').catch(() => {});
      });
    });
  });
});

// =============================================================================
// 02 — PAINEL PRINCIPAL
// =============================================================================
test('02-dashboard', async ({ browser }) => {
  await runSection(browser, '02-dashboard', { authenticated: true }, async (page, scene) => {
    await scene('02-dash-kpis', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1600); // gráficos animam
    });
    await scene('02-dash-graficos', async () => {
      await smoothScroll(page, 520);
      await smoothScroll(page, 1040);
    });
    await scene('02-dash-atividade', async () => {
      await smoothScroll(page, 2000);
      await smoothScroll(page, 99999);
    });
  });
});

// =============================================================================
// 03 — CADASTRO DE ALUNOS  (CRUD ao vivo)
// =============================================================================
test('03-alunos', async ({ browser }) => {
  await runSection(browser, '03-alunos', { authenticated: true }, async (page, scene) => {
    const cpf = validCPF();
    const codigo = `DEMO-${Date.now() % 100000}`;

    await scene('03-alunos-lista', async () => {
      await page.goto('/cadastros/alunos');
      await page.waitForLoadState('networkidle').catch(() => {});
      await safe('busca', async () => {
        const s = page.getByPlaceholder(/buscar|pesquisar|procurar/i).first();
        await s.click();
        await s.pressSequentially('Ana', { delay: 60 });
        await page.waitForTimeout(700);
        await s.fill('');
      });
    });

    await scene('03-alunos-novo', async () => {
      await clickByName(page, /novo aluno|\+\s*adicionar/i);
      await page.waitForTimeout(600);
      await fillField(page, /nome completo|^nome$/i, 'Maria Aparecida Silva');
      await fillField(page, /e-?mail/i, 'maria.demo@email.com');
      await fillField(page, /telefone/i, '(11) 91234-5678');
      await fillField(page, /cpf/i, cpf);
      await fillField(page, /c[óo]digo/i, codigo);
      await fillField(page, /respons[áa]vel/i, 'João Silva').catch(() => {});
      await fillField(page, /cidade/i, 'São Paulo');
      await fillField(page, /estado/i, 'SP');
      await fillField(page, /bairro/i, 'Centro');
      await fillField(page, /n[úu]mero/i, '100');
      await page.waitForTimeout(400);
    });

    await scene('03-alunos-salvar', async () => {
      await page.getByRole('button', { name: /^cadastrar$|^salvar$/i }).first().click();
      await page.waitForTimeout(1800); // fecha modal / atualiza lista
    });

    await scene('03-alunos-encaminhamento', async () => {
      await safe('abrir-encaminhamentos', async () => {
        const row = page.locator('tbody tr').first();
        const btns = row.locator('button');
        const n = await btns.count();
        for (let i = 0; i < n; i++) {
          const t = await btns.nth(i).getAttribute('title');
          if (t && /encaminhamento/i.test(t)) {
            await btns.nth(i).click();
            break;
          }
        }
        await page.waitForTimeout(900);
        const novo = page
          .getByRole('button', { name: /novo encaminhamento|adicionar encaminhamento|\+\s*adicionar/i })
          .first();
        if (await novo.count()) {
          await novo.click();
          await page.waitForTimeout(700);
          await fillField(page, /fun[çc][ãa]o|cargo/i, 'Estágio em TI').catch(() => {});
          await fillField(page, /contato.*rh|rh/i, 'Depto Pessoal').catch(() => {});
        }
      });
    });

    await scene('03-alunos-relatorio', async () => {
      // garante que nenhum modal (encaminhamentos) ficou aberto cobrindo o botão
      await page.keyboard.press('Escape').catch(() => {});
      await cancelModal(page);
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(400);
      await safe('relatorio', async () => {
        await page.getByRole('button', { name: /gerar relat[óo]rio|relat[óo]rio|baixar/i }).first().click();
        await page.waitForTimeout(1400);
        await cancelModal(page);
      });
    });
  });
});

// =============================================================================
// 04 — CADASTRO DE EMPRESAS  (CRUD ao vivo)
// =============================================================================
test('04-empresas', async ({ browser }) => {
  await runSection(browser, '04-empresas', { authenticated: true }, async (page, scene) => {
    await scene('04-emp-lista', async () => {
      await page.goto('/cadastros/empresas');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(500);
    });

    await scene('04-emp-novo', async () => {
      await clickByName(page, /nova empresa|\+\s*adicionar/i);
      await page.waitForTimeout(600);
      await fillField(page, /raz[ãa]o social|^nome$/i, 'Tech Solutions Demonstração LTDA');
      await fillField(page, /cnpj/i, validCNPJ());
      await fillField(page, /cidade/i, 'Campinas');
      await fillField(page, /estado/i, 'SP');
      await fillField(page, /bairro/i, 'Cambuí');
      await fillField(page, /n[úu]mero/i, '250');
      await fillField(page, /pa[íi]s/i, 'Brasil').catch(() => {});
      await page.waitForTimeout(400);
      await page.getByRole('button', { name: /^cadastrar$|^salvar$/i }).first().click();
      await page.waitForTimeout(1600);
    });

    await scene('04-emp-relatorio', async () => {
      await cancelModal(page);
      await safe('relatorio', async () => {
        await page.getByRole('button', { name: /relat[óo]rio|gerar relat[óo]rio|baixar/i }).first().click();
        await page.waitForTimeout(1200);
        await cancelModal(page);
      });
    });
  });
});

// =============================================================================
// 05 — CADASTRO DE FUNCIONÁRIOS  (CRUD ao vivo)
// =============================================================================
test('05-funcionarios', async ({ browser }) => {
  await runSection(browser, '05-funcionarios', { authenticated: true }, async (page, scene) => {
    await scene('05-func-lista', async () => {
      await page.goto('/cadastros/funcionarios');
      await page.waitForLoadState('networkidle').catch(() => {});
      await safe('filtro-funcao', async () => {
        const sel = page.locator('select').first();
        const opts = await sel.locator('option').all();
        if (opts.length > 1) {
          const v = await opts[1]!.getAttribute('value');
          if (v) await sel.selectOption(v);
          await page.waitForTimeout(800);
          await sel.selectOption('').catch(() => {});
        }
      });
    });

    await scene('05-func-novo', async () => {
      await clickByName(page, /novo funcion[áa]rio|\+\s*adicionar/i);
      await page.waitForTimeout(700);
      await fillField(page, /nome completo|^nome$/i, 'Carlos Eduardo Souza');
      await fillField(page, /e-?mail/i, `carlos.demo.${Date.now() % 100000}@nexo.com`);
      await fillField(page, /telefone/i, '(11) 98765-4321');
      await fillField(page, /cpf/i, validCPF());
      await fillField(page, /contato empresarial/i, 'Recursos Humanos').catch(() => {});
      await fillField(page, /cidade/i, 'São Paulo');
      await fillField(page, /estado/i, 'SP');
      await fillField(page, /bairro/i, 'Pinheiros');
      await fillField(page, /n[úu]mero/i, '45');
      await chooseSelect(page, /cargo|regra|fun[çc][ãa]o/i, 1).catch(() => {});
      await fillField(page, /senha/i, 'demo123456').catch(() => {}); // 1ª = "Senha *"
      await fillField(page, /confirma/i, 'demo123456').catch(() => {});
      await page.waitForTimeout(400);
      await page.getByRole('button', { name: /^cadastrar$|^salvar$/i }).first().click();
      await page.waitForTimeout(1600);
    });

    await scene('05-func-relatorio', async () => {
      await cancelModal(page);
      await safe('relatorio', async () => {
        await page.getByRole('button', { name: /relat[óo]rio|gerar relat[óo]rio|baixar/i }).first().click();
        await page.waitForTimeout(1200);
        await cancelModal(page);
      });
    });
  });
});

// =============================================================================
// 06 — CONSTRUTOR DE QUESTIONÁRIOS
// =============================================================================
test('06-questionarios', async ({ browser }) => {
  await runSection(browser, '06-questionarios', { authenticated: true }, async (page, scene) => {
    await scene('06-quest-lista', async () => {
      await page.goto('/cadastros/questionarios');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(500);
    });

    await scene('06-quest-campos', async () => {
      await clickByName(page, /novo question[áa]rio|\+\s*adicionar/i);
      await page.waitForTimeout(700);
      await fillField(page, /nome do question|t[íi]tulo|^nome$/i, 'Avaliação de Estágio (demo)').catch(() => {});
      // adiciona campos via FormBuilder: "Adicionar Campo" → escolhe tipo
      await safe('add-campo-texto', async () => {
        await page.getByRole('button', { name: /adicionar campo/i }).first().click();
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: /campo de texto/i }).first().click();
        await page.waitForTimeout(500);
      });
      await safe('add-campo-select', async () => {
        await page.getByRole('button', { name: /adicionar campo/i }).first().click();
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: /sele[çc][ãa]o [úu]nica/i }).first().click();
        await page.waitForTimeout(500);
      });
    });

    await scene('06-quest-preview', async () => {
      // alterna para o Editor JSON (nome único — não confunde com "Visualizar" de linha)
      await safe('toggle-json', async () => {
        await page.getByRole('button', { name: /editor json/i }).first().click();
        await page.waitForTimeout(900);
      });
      await safe('toggle-visual', async () => {
        await page.getByRole('button', { name: /editor visual/i }).first().click();
        await page.waitForTimeout(700);
      });
      // salva o questionário
      await safe('salvar', async () => {
        await page.getByRole('button', { name: /^criar$|^salvar$|^atualizar$/i }).first().click();
        await page.waitForTimeout(1500);
      });
      // garante que o modal do construtor fechou (lista visível)
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(400);
      // pré-visualização: abre o "Visualizar" de uma linha (botão aparece ao passar o mouse)
      await safe('preview-linha', async () => {
        const row = page.locator('tbody tr').first();
        await row.hover().catch(() => {});
        await page.waitForTimeout(300);
        const eye = row.locator('button[title*="Visualizar" i]').first();
        if (await eye.count()) {
          await eye.click({ timeout: 4000 });
          await page.waitForTimeout(1200);
          await cancelModal(page);
        }
      });
    });
  });
});

// =============================================================================
// 07 — RESPONDER QUESTIONÁRIO
// =============================================================================
test('07-responder', async ({ browser }) => {
  await runSection(browser, '07-responder', { authenticated: true }, async (page, scene) => {
    await scene('07-resp-lista', async () => {
      await page.goto('/questionarios/listar');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(500);
    });

    await scene('07-resp-form', async () => {
      await safe('abrir-responder', async () => {
        const r = page.locator('table button[title*="Responder" i]').first();
        if (await r.count()) await r.click();
        else await page.getByRole('button', { name: /responder/i }).first().click();
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(700);
      });
      // preenche campos visíveis (texto, select, radio, checkbox)
      await safe('preencher', async () => {
        const texts = page.locator(
          'main input[type="text"]:visible, main input:not([type]):visible, main input[type="email"]:visible, main input[type="number"]:visible, main textarea:visible',
        );
        const nt = await texts.count();
        for (let i = 0; i < Math.min(nt, 10); i++) {
          await texts.nth(i).fill('Resposta de exemplo').catch(() => {});
        }
        const selects = page.locator('main select:visible');
        const ns = await selects.count();
        for (let i = 0; i < ns; i++) {
          const opts = await selects.nth(i).locator('option').all();
          if (opts.length > 1) {
            const v = await opts[1]!.getAttribute('value');
            if (v) await selects.nth(i).selectOption(v).catch(() => {});
          }
        }
        // radios: marca o primeiro de cada grupo (por name)
        const radios = page.locator('main input[type="radio"]:visible');
        const seen = new Set<string>();
        const nr = await radios.count();
        for (let i = 0; i < nr; i++) {
          const name = (await radios.nth(i).getAttribute('name')) ?? `r${i}`;
          if (seen.has(name)) continue;
          seen.add(name);
          await radios.nth(i).check().catch(() => {});
        }
        // checkboxes: marca o primeiro
        const checks = page.locator('main input[type="checkbox"]:visible');
        if (await checks.count()) await checks.first().check().catch(() => {});
      });
    });

    await scene('07-resp-sucesso', async () => {
      await safe('enviar', async () => {
        await page.getByRole('button', { name: /enviar|salvar/i }).first().click();
        await page.waitForTimeout(2200);
      });
    });
  });
});

// =============================================================================
// 08 — RESPOSTAS DOS QUESTIONÁRIOS
// =============================================================================
test('08-respostas', async ({ browser }) => {
  await runSection(browser, '08-respostas', { authenticated: true }, async (page, scene) => {
    await scene('08-ans-seletor', async () => {
      await page.goto('/acompanhamentos/respostas-questionarios');
      await page.waitForLoadState('networkidle').catch(() => {});
      await safe('selecionar', async () => {
        const sel = page.locator('select').first();
        const opts = await sel.locator('option').all();
        if (opts.length > 1) {
          const v = await opts[1]!.getAttribute('value');
          if (v) await sel.selectOption(v);
          await page.waitForTimeout(900);
        }
      });
    });

    await scene('08-ans-stats', async () => {
      await smoothScroll(page, 300);
      await safe('stats', async () => {
        const st = page.getByRole('button', { name: /estat[íi]sticas/i }).first();
        if (await st.count()) {
          await st.click();
          await page.waitForTimeout(600);
        }
      });
    });

    await scene('08-ans-detalhe', async () => {
      await safe('detalhe', async () => {
        const view = page.locator('tbody tr').first().getByRole('button').first();
        if (await view.count()) {
          await view.click();
          await page.waitForTimeout(1000);
          await cancelModal(page);
        }
      });
    });
  });
});

// =============================================================================
// 09 — AGENDA E EVENTOS  (CRUD ao vivo)
// =============================================================================
test('09-agenda', async ({ browser }) => {
  await runSection(browser, '09-agenda', { authenticated: true }, async (page, scene) => {
    await scene('09-ag-mes', async () => {
      await page.goto('/agenda');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1200); // FullCalendar monta
    });

    await scene('09-ag-novo', async () => {
      await safe('novo-evento', async () => {
        await page.getByRole('button', { name: /novo evento|\+\s*adicionar|criar|agendar/i }).first().click();
        await page.waitForTimeout(700);
        await fillField(page, /t[íi]tulo/i, 'Reunião de acompanhamento (demo)').catch(() => {});
        // 'generico' não exige aluno/empresa → salva e aparece no calendário
        await selectValue(page, /tipo de evento|^tipo/i, 'generico').catch(() => {});
        await fillField(page, /in[íi]cio/i, dtLocal(3, 10)).catch(() => {});
        await fillField(page, /fim/i, dtLocal(3, 11)).catch(() => {});
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: /^cadastrar$|^salvar$/i }).first().click();
        await page.waitForTimeout(1600);
      });
    });

    await scene('09-ag-editar', async () => {
      await safe('editar-evento', async () => {
        const ev = page.locator('.fc-event, .fc-daygrid-event').first();
        if (await ev.count()) {
          await ev.click();
          await page.waitForTimeout(1000);
          await cancelModal(page);
        }
      });
    });
  });
});

// =============================================================================
// 10 — CONFIGURAÇÃO DE E-MAIL (SMTP)
// =============================================================================
test('10-smtp', async ({ browser }) => {
  await runSection(browser, '10-smtp', { authenticated: true }, async (page, scene) => {
    await scene('10-smtp-form', async () => {
      await page.goto('/configuracao/smtp');
      await page.waitForLoadState('networkidle').catch(() => {});
      await fillField(page, /host|servidor/i, 'smtp.gmail.com').catch(() => {});
      await fillField(page, /porta/i, '587').catch(() => {});
      await fillField(page, /usu[áa]rio|user/i, 'sistema@exemplo.com').catch(() => {});
      await fillField(page, /senha/i, 'app-password').catch(() => {});
      await fillField(page, /de|from|remetente/i, 'sistema@exemplo.com').catch(() => {});
      await page.waitForTimeout(500);
    });

    await scene('10-smtp-teste', async () => {
      // aponta para o mailpit local → teste de conexão com sucesso
      await fillField(page, /host|servidor/i, 'localhost').catch(() => {});
      await fillField(page, /porta/i, '1025').catch(() => {});
      await safe('testar', async () => {
        await page.getByRole('button', { name: /testar/i }).first().click();
        await page.waitForTimeout(2500);
      });
    });
  });
});

// =============================================================================
// 11 — ENCERRAMENTO
// =============================================================================
test('11-outro', async ({ browser }) => {
  await runSection(browser, '11-outro', { authenticated: true }, async (page, scene) => {
    await scene('11-outro-resumo', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1000);
      await smoothScroll(page, 400);
    });
    await scene('11-outro-logout', async () => {
      await smoothScroll(page, 0);
      await safe('logout', async () => {
        await page.getByRole('button', { name: /sair|logout/i }).first().click();
        await page.waitForTimeout(1500);
      });
    });
  });
});
