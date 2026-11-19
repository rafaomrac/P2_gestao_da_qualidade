"use strict";

/**
 * CASO DE TESTE: CT-B02
 * Modalidade: Teste de Caixa-Preta (Particionamento de Equivalência e Análise de Valor-Limite)
 *
 * Requisito: RF-05 (Carrinho de compras) e RF-06 (Controle de estoque)
 * Regra de Negócio: RN-03 (A quantidade de cada item deve ser inteira, positiva e <= estoque)
 *
 * Defeito Relacionado: BUG-01 (Antes da correção, quantidade 6 era aceita indevidamente).
 *
 * Mapeamento das Classes de Equivalência e Valores-Limite:
 *   - Classe Inválida (Negativos): -1 -> Rejeitado (400)
 *   - Limite Inferior Inválido: 0 -> Rejeitado (400)
 *   - Limite Inferior Válido: 1 -> Aceito (200), subtotal R$ 150,00
 *   - Classe Inválida (Fracionários): 1.5 -> Rejeitado (400)
 *   - Limite Superior Válido: 5 (igual ao estoque) -> Aceito (200), subtotal R$ 750,00
 *   - Limite Superior Inválido: 6 (acima do estoque) -> Rejeitado (400)
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { start } = require("../server");

const BASE_DB = path.join(__dirname, "..", "data", "db.json");

let server;
let baseUrl;
let tempDb;
const dbAnterior = process.env.DB_PATH;

test.before(async () => {
  assert.ok(fs.existsSync(BASE_DB), "data/db.json não encontrado: rode npm run reset antes");
  tempDb = path.join(os.tmpdir(), `aurora-caixa-preta-${Date.now()}.json`);
  fs.copyFileSync(BASE_DB, tempDb);
  process.env.DB_PATH = tempDb;
  server = await start(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) {
    if (server.closeAllConnections) server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  if (tempDb) fs.rmSync(tempDb, { force: true });
  if (dbAnterior === undefined) delete process.env.DB_PATH;
  else process.env.DB_PATH = dbAnterior;
});

/**
 * Função auxiliar para solicitar cotação via API
 * @param {number} quantidade - Quantidade enviada no payload
 */
async function cotar(quantidade) {
  const resposta = await fetch(`${baseUrl}/api/cart/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ productId: "produto-teste", quantity: quantidade }] }),
  });
  const json = await resposta.json();
  return { status: resposta.status, json };
}

// 1. Verificação de Pré-Condição do Ambiente
test("CT-B02 pré-condição: produto-teste com preço 150 e estoque 5", async () => {
  const resposta = await fetch(`${baseUrl}/api/products/produto-teste`);
  const produto = await resposta.json();
  assert.equal(resposta.status, 200);
  assert.equal(produto.price, 150, "Preço do produto-teste deve ser R$ 150,00");
  assert.equal(produto.stock, 5, "Estoque inicial do produto-teste deve ser exatamente 5 unidades");
});

// 2. Tabela de Casos de Caixa-Preta (Classes e Fronteiras)
const casos = [
  [-1, "Classe inválida: inteiro negativo", null],
  [0, "Valor-limite inferior inválido: zero", null],
  [1, "Valor-limite inferior válido: 1 unidade", 150],
  [1.5, "Classe inválida: número fracionário", null],
  [5, "Valor-limite superior válido: igual ao estoque físico (5)", 750],
  [6, "Valor-limite superior inválido: acima do estoque disponível (6)", null],
];

for (const [quantidade, descricao, subtotalEsperado] of casos) {
  const acao = subtotalEsperado === null ? "rejeitada" : `aceita (subtotal R$ ${subtotalEsperado})`;
  test(`CT-B02 quantidade ${quantidade} (${descricao}) -> ${acao}`, async () => {
    const r = await cotar(quantidade);
    if (subtotalEsperado === null) {
      assert.equal(r.status, 400, `Quantidade ${quantidade} deveria ser rejeitada com HTTP 400 (RN-03)`);
      assert.equal(typeof r.json.error, "string");
      assert.ok(r.json.error.length > 0, "A rejeição deve trazer mensagem explicativa");
    } else {
      assert.equal(r.status, 200, `Quantidade ${quantidade} deveria ser aceita com HTTP 200`);
      assert.equal(r.json.subtotal, subtotalEsperado, `Subtotal incorreto para quantidade ${quantidade}`);
    }
  });
}
