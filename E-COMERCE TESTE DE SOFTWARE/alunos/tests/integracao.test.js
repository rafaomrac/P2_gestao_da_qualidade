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
  tempDb = path.join(os.tmpdir(), `aurora-integracao-${Date.now()}.json`);
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

async function chamar(metodo, rota, { token, corpo } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (corpo) headers["Content-Type"] = "application/json";
  const resposta = await fetch(baseUrl + rota, {
    method: metodo,
    headers,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await resposta.text();
  let json = null;
  try { json = JSON.parse(texto); } catch (e) { /* resposta sem JSON */ }
  return { status: resposta.status, json, texto };
}

test("CT-I02 cadastro, sessao e logout", async (t) => {
  // e-mail unico por execucao, para nao colidir com usuarios ja cadastrados
  const email = `aluno.p2.${Date.now()}@loja.test`;
  const senha = "Senha123";
  let token1;

  await t.test("CT-I02 passo 1: cadastro responde 201 com token e usuario cliente, sem senha nem hash", async () => {
    const r = await chamar("POST", "/api/auth/register", {
      corpo: { name: "Aluno Teste", email, password: senha },
    });
    assert.equal(r.status, 201);
    assert.equal(typeof r.json.token, "string");
    assert.ok(r.json.token.length > 0);
    assert.equal(r.json.user.email, email);
    assert.equal(r.json.user.role, "customer");
    assert.ok(!r.texto.includes("passwordHash"), "a resposta nao deve expor passwordHash");
    assert.ok(!r.texto.includes(senha), "a resposta nao deve conter a senha");
    token1 = r.json.token;
  });

  await t.test("CT-I02 passo 2: /auth/me com o token responde 200 com o usuario", async () => {
    const r = await chamar("GET", "/api/auth/me", { token: token1 });
    assert.equal(r.status, 200);
    assert.equal(r.json.user.email, email);
  });

  await t.test("CT-I02 passo 3: logout responde 200", async () => {
    const r = await chamar("POST", "/api/auth/logout", { token: token1 });
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
  });

  await t.test("CT-I02 passo 4: /auth/me com o mesmo token apos o logout responde 401", async () => {
    const r = await chamar("GET", "/api/auth/me", { token: token1 });
    assert.equal(r.status, 401);
  });

  await t.test("CT-I02 passo 5: novo login responde 200 com token diferente", async () => {
    const r = await chamar("POST", "/api/auth/login", { corpo: { email, password: senha } });
    assert.equal(r.status, 200);
    assert.equal(typeof r.json.token, "string");
    assert.notEqual(r.json.token, token1);
    assert.equal(r.json.user.email, email);
  });
});