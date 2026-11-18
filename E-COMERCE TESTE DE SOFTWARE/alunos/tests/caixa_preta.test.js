"use strict";


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
  assert.ok(fs.existsSync(BASE_DB), "data/db.json nao encontrado: rode npm run reset antes");
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

async function cotar(quantidade) {
  const resposta = await fetch(`${baseUrl}/api/cart/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ productId: "produto-teste", quantity: quantidade }] }),
  });
  const json = await resposta.json();
  return { status: resposta.status, json };
}

test("CT-B02 pre-condicao: produto-teste com preco 150 e estoque 5", async () => {
  const resposta = await fetch(`${baseUrl}/api/products/produto-teste`);
  const produto = await resposta.json();
  assert.equal(resposta.status, 200);
  assert.equal(produto.price, 150, "Resetar os dados antes: preco deve ser 150");
  assert.equal(produto.stock, 5, "Resetar os dados antes: estoque deve ser 5");
});

const casos = [
  [-1, "classe invalida: inteiro negativo", null],
  [0, "valor-limite inferior invalido: zero", null],
  [1, "valor-limite inferior valido: 1", 150],
  [1.5, "classe invalida: nao inteiro", null],
  [5, "valor-limite superior valido: igual ao estoque", 750],
  [6, "valor-limite superior invalido: acima do estoque", null],
];

for (const [quantidade, descricao, subtotalEsperado] of casos) {
  const acao = subtotalEsperado === null ? "rejeitada" : `aceita (subtotal ${subtotalEsperado})`;
  test(`CT-B02 quantidade ${quantidade} (${descricao}) -> ${acao}`, async () => {
    const r = await cotar(quantidade);
    if (subtotalEsperado === null) {
      assert.equal(r.status, 400, `quantidade ${quantidade} deveria ser rejeitada (RN-03)`);
      assert.equal(typeof r.json.error, "string");
      assert.ok(r.json.error.length > 0, "a rejeicao deve trazer mensagem");
    } else {
      assert.equal(r.status, 200, `quantidade ${quantidade} deveria ser aceita`);
      assert.equal(r.json.subtotal, subtotalEsperado);
    }
  });
}