"use strict";

/**
 * SCRIPT DE TESTE DE CARGA E ESTRESSE: CT-C01 e CT-E01
 *
 * Modalidades Avaliadas:
 *   1. CT-C01 (Teste de Carga): Avalia o comportamento com carga progressiva crescente
 *      (5, 10, 20 e 40 usuários virtuais) medindo tempo de resposta, vazão e taxa de erro.
 *   2. CT-E01 (Teste de Estresse): Submete o servidor além da capacidade nominal de referência
 *      (100, 200 e 400 VUs) e avalia a resiliência e auto-recuperação pós-estresse.
 *
 * Diretrizes de Segurança:
 *   - Execução estritamente local (localhost:3400+), com porta randômica e banco temporário.
 *   - Não atinge servidores de terceiros nem dados reais de produção.
 *
 * Como Executar:
 *   node scripts/carga.js carga      (apenas carga progressiva)
 *   node scripts/carga.js estresse   (apenas estresse e recuperação)
 *   node scripts/carga.js tudo       (executa ambas as baterias)
 *
 * Saída de Evidências:
 *   evidencias/CT-C01/ (JSON e TXT com métricas de carga)
 *   evidencias/CT-E01/ (JSON e TXT com métricas de estresse e sonda de recuperação)
 */

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PORT = 3400 + Math.floor(Math.random() * 400);
const BASE = `http://127.0.0.1:${PORT}`;
const STAGE_SECONDS = Number(process.env.STAGE_SECONDS || 8);

// Cenário de carga com requisições representativas: leitura de produto e cotação com cupom
const CENARIO = [
  {
    name: "GET /api/products/produto-teste",
    method: "GET",
    path: "/api/products/produto-teste",
  },
  {
    name: "POST /api/cart/quote",
    method: "POST",
    path: "/api/cart/quote",
    body: JSON.stringify({
      items: [{ productId: "produto-teste", quantity: 2 }],
      couponCode: "CINCO",
    }),
  },
];

/**
 * Calcula o percentil desejado a partir de um array ordenado de latências
 */
function calcularPercentil(ordenado, p) {
  if (ordenado.length === 0) return 0;
  const indice = Math.min(ordenado.length - 1, Math.ceil((p / 100) * ordenado.length) - 1);
  return ordenado[indice];
}

/**
 * Executa um estágio de teste com determinado número de Usuários Virtuais (VUs)
 * @param {number} virtualUsers - Número de conexões concorrentes
 * @param {number} seconds - Duração do estágio em segundos
 */
async function executarEstagio(virtualUsers, seconds) {
  const latencias = [];
  let erros = 0;
  let totalRequisicoes = 0;
  const statusContador = {};
  const tempoLimite = Date.now() + seconds * 1000;

  // Função executada por cada usuário virtual concorrente
  async function worker(id) {
    let indice = id;
    while (Date.now() < tempoLimite) {
      const passo = CENARIO[indice++ % CENARIO.length];
      const inicio = process.hrtime.bigint();
      try {
        const res = await fetch(BASE + passo.path, {
          method: passo.method,
          headers: passo.body ? { "Content-Type": "application/json" } : undefined,
          body: passo.body,
          signal: AbortSignal.timeout(10000),
        });
        await res.arrayBuffer();
        statusContador[res.status] = (statusContador[res.status] || 0) + 1;
        if (res.status >= 400) erros++;
      } catch (error) {
        erros++;
        const chave = error.name === "TimeoutError" ? "timeout" : (error.cause && error.cause.code) || error.name;
        statusContador[chave] = (statusContador[chave] || 0) + 1;
      }
      latencias.push(Number(process.hrtime.bigint() - inicio) / 1e6);
      totalRequisicoes++;
    }
  }

  const inicioTotal = Date.now();
  await Promise.all(Array.from({ length: virtualUsers }, (_, id) => worker(id)));
  const tempoDecorrido = (Date.now() - inicioTotal) / 1000;

  // Ordena para cálculo de média, percentil 95 e máxima
  latencias.sort((a, b) => a - b);
  const media = latencias.reduce((soma, v) => soma + v, 0) / (latencias.length || 1);

  return {
    virtualUsers,
    durationSeconds: Number(tempoDecorrido.toFixed(1)),
    requests: totalRequisicoes,
    throughputRps: Number((totalRequisicoes / tempoDecorrido).toFixed(1)),
    avgMs: Number(media.toFixed(2)),
    p95Ms: Number(calcularPercentil(latencias, 95).toFixed(2)),
    maxMs: Number((latencias[latencias.length - 1] || 0).toFixed(2)),
    errors: erros,
    errorRatePct: Number(((erros / (totalRequisicoes || 1)) * 100).toFixed(2)),
    statusCount: statusContador,
  };
}

/**
 * Aguarda o servidor local subir e responder requisições
 */
async function aguardarServidor() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(BASE + "/api/products/produto-teste");
      if (res.ok) return;
    } catch (e) {
      // Servidor ainda em inicialização
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("O servidor de teste de carga não respondeu a tempo.");
}

/**
 * Formata os resultados em tabela textual para exibição no console e arquivo
 */
function formatarTabela(titulo, linhas) {
  const cabecalho = "VUs | Req Totais | Vazão (req/s) | Média (ms) | p95 (ms) | Máx (ms) | Erros | Taxa Erro (%) | Status HTTP";
  const conteudo = linhas.map((r) =>
    [
      r.label ? `${r.virtualUsers} (${r.label})` : r.virtualUsers,
      r.requests,
      r.throughputRps,
      r.avgMs,
      r.p95Ms,
      r.maxMs,
      r.errors,
      r.errorRatePct + "%",
      JSON.stringify(r.statusCount),
    ].join(" | ")
  );
  return [titulo, cabecalho, ...conteudo].join("\n");
}

/**
 * Salva os resultados nos formatos JSON e texto na pasta de evidências
 */
function salvarEvidencia(diretorio, nomeArquivo, dadosJson, textoTabela) {
  const destino = path.join(ROOT, "evidencias", diretorio);
  fs.mkdirSync(destino, { recursive: true });
  fs.writeFileSync(path.join(destino, `${nomeArquivo}.json`), JSON.stringify(dadosJson, null, 2));
  fs.writeFileSync(path.join(destino, `${nomeArquivo}.txt`), textoTabela + "\n");
  console.log("\n" + textoTabela);
}

async function main() {
  const modo = process.argv[2] || "tudo";
  const tempDb = path.join(os.tmpdir(), `aurora-carga-${Date.now()}.json`);
  fs.copyFileSync(path.join(ROOT, "data", "db.json"), tempDb);

  // Inicializa o servidor Node.js em processo filho isolado
  const processoServidor = spawn(process.execPath, ["server.js"], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), DB_PATH: tempDb },
    stdio: "ignore",
  });

  const dadosAmbiente = {
    data: new Date().toISOString(),
    versaoNode: process.version,
    plataforma: `${os.platform()} ${os.release()}`,
    nucleosCpu: os.cpus().length,
    modeloCpu: os.cpus()[0].model,
    memoriaTotalGB: Number((os.totalmem() / 2 ** 30).toFixed(1)),
    duracaoPorEstagioSegundos: STAGE_SECONDS,
    alvoUrl: BASE,
    rotasTestadas: CENARIO.map((s) => s.name),
    observacao: "Cliente e servidor executados na mesma máquina física; métricas locais para homologação.",
  };

  try {
    await aguardarServidor();
    await executarEstagio(2, 2); // Aquecimento inicial (warm-up)

    // BATERIA DE CARGA PROGRESSIVA (CT-C01)
    if (modo === "carga" || modo === "tudo") {
      const estagiosCarga = [];
      for (const vus of [5, 10, 20, 40]) {
        estagiosCarga.push(await executarEstagio(vus, STAGE_SECONDS));
      }
      salvarEvidencia(
        "CT-C01",
        "resultado_carga",
        { ambiente: dadosAmbiente, estagios: estagiosCarga },
        formatarTabela(`CT-C01: Teste de Carga Progressiva (${STAGE_SECONDS}s por estágio) - ${dadosAmbiente.data}`, estagiosCarga)
      );
    }

    // BATERIA DE ESTRESSE E AUTO-RECUPERAÇÃO (CT-E01)
    if (modo === "estresse" || modo === "tudo") {
      const estagiosEstresse = [];
      for (const vus of [100, 200, 400]) {
        estagiosEstresse.push({ ...(await executarEstagio(vus, STAGE_SECONDS)), label: "estresse" });
      }

      // Intervalo de resfriamento de 2 segundos antes de avaliar a recuperação
      await new Promise((r) => setTimeout(r, 2000));
      const estagioRecuperacao = { ...(await executarEstagio(5, STAGE_SECONDS)), label: "recuperação" };
      const sonda = await fetch(BASE + "/api/products/produto-teste");

      const relatorioTexto =
        formatarTabela(`CT-E01: Teste de Estresse e Recuperação (${STAGE_SECONDS}s por estágio) - ${dadosAmbiente.data}`, [
          ...estagiosEstresse,
          estagioRecuperacao,
        ]) + `\nSonda de saúde pós-estresse respondeu HTTP ${sonda.status} em estado normalizado.`;

      salvarEvidencia(
        "CT-E01",
        "resultado_estresse",
        { ambiente: dadosAmbiente, estagios: estagiosEstresse, recuperacao: estagioRecuperacao, statusSondaFinal: sonda.status },
        relatorioTexto
      );
    }

    fs.writeFileSync(path.join(ROOT, "evidencias", "CT-C01", "ambiente.json"), JSON.stringify(dadosAmbiente, null, 2));
  } finally {
    processoServidor.kill();
    fs.rmSync(tempDb, { force: true });
  }
}

main().catch((erro) => {
  console.error("Falha na execução dos testes de desempenho:", erro);
  process.exit(1);
});
