"use strict";

/**
 * MÓDULO AUXILIAR DE TESTES DE INTEGRAÇÃO / API
 *
 * Propósito:
 *   Inicializa uma instância real do servidor Node.js em uma porta dinâmica (porta 0),
 *   conectada a uma cópia temporária e descartável de `data/db.json` gerada em `os.tmpdir()`.
 *   Isso garante que nenhum teste contamine a base de dados original nem sofra interferência.
 */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { start } = require("../../server");

const BASE_DB = path.join(__dirname, "..", "..", "data", "db.json");
const TEST_PASSWORD = "SenhaDidatica123!";

/**
 * Inicializa ambiente temporário de teste
 * @param {string} prefixo - Nome para o arquivo temporário
 */
async function iniciar(prefixo = "aurora-p2") {
  if (!fs.existsSync(BASE_DB)) {
    throw new Error("data/db.json não encontrado: rode 'npm run reset' antes dos testes.");
  }
  const tempDb = path.join(os.tmpdir(), `${prefixo}-${Date.now()}-${process.pid}.json`);
  fs.copyFileSync(BASE_DB, tempDb);
  const dbAnterior = process.env.DB_PATH;
  process.env.DB_PATH = tempDb;
  const server = await start(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  /**
   * Realiza chamadas HTTP contra a API em execução
   */
  async function chamar(metodo, rota, { token, corpo, bruto } = {}) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (corpo !== undefined || bruto !== undefined) headers["Content-Type"] = "application/json";
    const resposta = await fetch(baseUrl + rota, {
      method: metodo,
      headers,
      body: bruto !== undefined ? bruto : corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
    const texto = await resposta.text();
    let json = null;
    try {
      json = JSON.parse(texto);
    } catch (erro) {
      // Resposta sem corpo JSON válido
    }
    return { status: resposta.status, json, texto };
  }

  /**
   * Realiza login e retorna o token de autenticação
   */
  async function login(email, senha = TEST_PASSWORD) {
    const r = await chamar("POST", "/api/auth/login", { corpo: { email, password: senha } });
    if (r.status !== 200) throw new Error(`Login de ${email} falhou: HTTP ${r.status}`);
    return r.json.token;
  }

  /**
   * Encerra o servidor e remove a base temporária
   */
  async function parar() {
    if (server.closeAllConnections) server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tempDb, { force: true });
    if (dbAnterior === undefined) delete process.env.DB_PATH;
    else process.env.DB_PATH = dbAnterior;
  }

  return { baseUrl, tempDb, chamar, login, parar };
}

// Endereço válido para testes de checkout
const ENDERECO_VALIDO = {
  street: "Rua Fictícia",
  number: "10",
  district: "Centro",
  city: "Cidade Didática",
  state: "RJ",
  zip: "20000000",
};

module.exports = { iniciar, ENDERECO_VALIDO, TEST_PASSWORD };
