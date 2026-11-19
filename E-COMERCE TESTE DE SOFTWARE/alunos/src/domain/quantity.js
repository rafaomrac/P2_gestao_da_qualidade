
"use strict";

/**
 * Módulo de Validação de Quantidade de Itens
 * Rastreabilidade: RF-05, RF-06 e Regra de Negócio RN-03.
 *
 * @param {number} quantity - Quantidade solicitada pelo cliente.
 * @param {number} [stock]  - Estoque disponível em estoque físico.
 * @returns {{ ok: boolean, quantity?: number, message?: string }}
 */
function validateQuantity(quantity, stock) {
  // RN-03: A quantidade deve ser um número inteiro, finito e estritamente positivo (>= 1)
  if (
    typeof quantity !== "number" ||
    !Number.isFinite(quantity) ||
    quantity < 1 ||
    !Number.isInteger(quantity)
  ) {
    return {
      ok: false,
      message: "Quantidade inválida"
    };
  }

  // RN-03 / Correção do BUG-01:
  // A quantidade solicitada não pode exceder o estoque físico disponível do produto.
  // Caso o estoque seja informado, validamos o limite superior.
  if (stock !== undefined && stock !== null && quantity > Number(stock)) {
    return {
      ok: false,
      message: "Quantidade acima do estoque disponível"
    };
  }

  return {
    ok: true,
    quantity
  };
}

module.exports = {
  validateQuantity
};
