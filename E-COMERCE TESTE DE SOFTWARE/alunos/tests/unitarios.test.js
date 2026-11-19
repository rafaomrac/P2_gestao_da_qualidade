"use strict";

/**
 * CASOS DE TESTE: CT-U01 a CT-U04
 * Modalidade: Testes Unitários de Regras de Domínio Isoladas
 *
 * Rastreabilidade:
 *   - CT-U01: RN-01 (Sem desconto abaixo de R$ 200,00)
 *   - CT-U02: RN-01 (Desconto de 10% no limite exato de R$ 200,00)
 *   - CT-U03: RN-03 (Validação de quantidade negativa como inválida)
 *   - CT-U04: RN-06 (Arredondamento monetário Half-Up de meio centavo)
 */

const test = require("node:test");
const assert = require("node:assert/strict");

const { automaticDiscount } = require("../src/domain/discount");
const { validateQuantity } = require("../src/domain/quantity");
const { percentOf } = require("../src/domain/money");

// CT-U01: Subtotal imediatamente abaixo do limite não deve conceder desconto
test("CT-U01 unitário: abaixo de 200 não há desconto", () => {
  assert.equal(automaticDiscount(199.99), 0, "Subtotal R$ 199,99 deve ter desconto R$ 0,00");
});

// CT-U02: Subtotal exatamente no limite deve conceder 10%
test("CT-U02 unitário: exatamente 200 recebe 10%", () => {
  assert.equal(automaticDiscount(200), 20, "Subtotal R$ 200,00 deve ter desconto de R$ 20,00");
});

// CT-U03: Quantidade menor que 1 deve ser rejeitada pela regra RN-03
test("CT-U03 unitário: quantidade negativa é inválida", () => {
  assert.equal(validateQuantity(-1).ok, false, "Quantidade negativa deve retornar ok: false");
});

// CT-U04: Arredondamento Half-Up a partir de meio centavo (200.05 * 10% = 20.005 -> 20.01)
test("CT-U04 unitário: meio centavo arredonda para cima", () => {
  assert.equal(percentOf(200.05, 10), 20.01, "Cálculo financeiro deve arredondar 20.005 para 20.01");
});
