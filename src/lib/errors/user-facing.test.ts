import assert from "node:assert/strict";
import { test } from "node:test";

import { USER_MESSAGES, isUnsafeUserMessage, toUserFacingMessage } from "./user-facing.ts";

test("maps known API codes to clear copy", () => {
  assert.equal(
    toUserFacingMessage({ code: "STRIPE_PRICE_MISSING", error: "Pacote sem stripe_price_id configurado." }, "fallback"),
    USER_MESSAGES.packageUnavailable,
  );
  assert.equal(
    toUserFacingMessage({ code: "AUTH_REQUIRED", error: "Não autenticado." }, "x"),
    USER_MESSAGES.authRequired,
  );
  assert.equal(
    toUserFacingMessage({ code: "INVALID_PREDICTION_ID", error: "predictionId inválido." }, "x"),
    "Não foi possível enviar esta previsão. Gere novamente e tente de novo.",
  );
});

test("keeps safe Portuguese API messages", () => {
  assert.equal(
    toUserFacingMessage({ error: "Informe uma URL iCal pública válida (https)." }, "fallback"),
    "Informe uma URL iCal pública válida (https).",
  );
});

test("hides technical or english provider copy", () => {
  assert.equal(
    toUserFacingMessage({ message: "Password should be at least 6 characters." }, USER_MESSAGES.generic),
    USER_MESSAGES.generic,
  );
  assert.equal(
    toUserFacingMessage({ message: "NotAllowedError: play() failed because the user didn't interact" }, USER_MESSAGES.listenFailed),
    USER_MESSAGES.listenFailed,
  );
  assert.equal(
    toUserFacingMessage({ error: "Stripe ainda não configurado (faltam chaves)." }, USER_MESSAGES.paymentsUnavailable),
    USER_MESSAGES.paymentsUnavailable,
  );
  assert.equal(isUnsafeUserMessage("priceCents inválido."), true);
});

test("uses fallback when input is empty", () => {
  assert.equal(toUserFacingMessage(null, "Tente de novo."), "Tente de novo.");
  assert.equal(toUserFacingMessage({}, "Tente de novo."), "Tente de novo.");
});
