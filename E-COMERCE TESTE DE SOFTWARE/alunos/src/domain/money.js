
"use strict";

function toCents(value) {
  const number = Number(value);

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(number)
  ) {
    throw new Error("Valor monetário inválido.");
  }

  return Math.round(number * 100);
}

function fromCents(cents) {
  if (!Number.isSafeInteger(cents)) {
    throw new Error("Valor em centavos inválido.");
  }

  return cents / 100;
}

function percentOf(amount, percent) {
  const cents = toCents(amount);
  const percentage = Number(percent);

  if (!Number.isFinite(percentage) || percentage < 0) {
    throw new Error("Percentual inválido.");
  }

  const resultCents = Math.round(
    (cents * percentage) / 100
  );

  return fromCents(resultCents);
}

module.exports = {
  toCents,
  fromCents,
  percentOf
};
