"use strict";

/**
 * CASO DE TESTE: CT-B01
 * Modalidade: Teste de Caixa-Preta
 * Técnicas Aplicadas:
 *   1. Particionamento de Classes de Equivalência (EP - Equivalence Partitioning)
 *   2. Análise de Valor-Limite (BVA - Boundary Value Analysis)
 *
 * Requisitos e Regras Avaliadas:
 *   - RN-01: Compras com subtotal >= R$ 200,00 recebem 10% de desconto automático.
 *   - RN-02: Frete grátis para subtotal >= R$ 300,00 (antes dos descontos). Abaixo desse valor, frete = R$ 18,50.
 *   - RN-06: Precisão de centavos com arredondamento Half-Up (>= 0,5 centavo sobe).
 *
 * Mapeamento de Classes de Equivalência:
 *   - Classe 1: Subtotal em [0.01; 199.99] -> Sem desconto (R$ 0,00) e frete integral (R$ 18,50).
 *   - Classe 2: Subtotal em [200.00; 299.99] -> 10% de desconto e frete integral (R$ 18,50).
 *   - Classe 3: Subtotal em [300.00; +inf)  -> 10% de desconto e frete grátis (R$ 0,00).
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const { quoteLines } = require("../src/domain/pricing");

/**
 * Função auxiliar para simular uma cotação com valor de subtotal arbitrário
 * @param {number} subtotal - Valor monetário do produto no carrinho
 */
function cotar(subtotal) {
  return quoteLines({
    lines: [
      {
        productId: "produto-teste",
        name: "Produto Teste",
        unitPrice: subtotal,
        quantity: 1,
      },
    ],
  });
}

// Matriz de Casos de Teste de Caixa-Preta:
// [subtotal, descontoEsperado, freteEsperado, totalEsperado, descriçãoTécnica]
const casos = [
  // --- CLASSE 1: Menor que R$ 200,00 (Sem desconto, frete pago) ---
  [0.01, 0, 18.5, 18.51, "EP: Classe 1 (valor mínimo possível)"],
  [199.99, 0, 18.5, 218.49, "BVA: Imediatamente abaixo da fronteira de R$ 200 (199.99)"],

  // --- CLASSE 2: De R$ 200,00 a R$ 299,99 (Desconto 10%, frete pago) ---
  [200.0, 20, 18.5, 198.5, "BVA: Exatamente na fronteira de R$ 200 (desconto de 10% ativo)"],
  [200.01, 20, 18.5, 198.51, "BVA: Imediatamente acima de R$ 200 (10% de 200.01 = 20.001 -> arredonda para 20.00)"],
  [250.0, 25, 18.5, 243.5, "EP: Classe 2 (valor típico intermediário)"],
  [299.99, 30, 18.5, 288.49, "BVA: Imediatamente abaixo da fronteira de frete grátis de R$ 300 (10% = 29.999 -> 30.00)"],

  // --- CLASSE 3: A partir de R$ 300,00 (Desconto 10%, frete grátis) ---
  [300.0, 30, 0, 270, "BVA: Exatamente na fronteira de R$ 300 (desconto 10% + frete zero)"],
  [300.01, 30, 0, 270.01, "BVA: Imediatamente acima de R$ 300 (desconto 10% + frete zero)"],
  [1000.0, 100, 0, 900, "EP: Classe 3 (valor alto demonstrativo)"],

  // --- CASO ESPECÍFICO DE ARREDONDAMENTO HALF-UP (RN-06) ---
  [200.05, 20.01, 18.5, 198.54, "RN-06: Meio centavo arredonda para cima (10% de 200.05 = 20.005 -> 20.01)"],
];

for (const [subtotal, desconto, frete, total, descricao] of casos) {
  test(`CT-B01 subtotal R$ ${subtotal} -> desc R$ ${desconto}, frete R$ ${frete}, total R$ ${total} (${descricao})`, () => {
    const resultado = cotar(subtotal);

    // Asserções para garantir integridade do cálculo
    assert.equal(resultado.ok, true, "A cotação deveria ser processada com sucesso");
    assert.equal(resultado.subtotal, subtotal, "Subtotal deve refletir o valor informado");
    assert.equal(resultado.discount, desconto, `Desconto incorreto para subtotal R$ ${subtotal}`);
    assert.equal(resultado.shipping, frete, `Cálculo de frete incorreto para subtotal R$ ${subtotal}`);
    assert.equal(resultado.total, total, `Total final incorreto para subtotal R$ ${subtotal}`);
  });
}
