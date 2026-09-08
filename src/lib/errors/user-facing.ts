export const USER_MESSAGES = {
  generic: "Algo deu errado. Tente novamente em instantes.",
  connection: "Falha de conexão. Verifique sua internet e tente novamente.",
  authRequired: "Entre na sua conta para continuar.",
  paymentsUnavailable: "Pagamentos indisponíveis no momento. Tente novamente em instantes.",
  packageUnavailable: "Este pacote não está disponível para compra agora.",
  checkoutFailed: "Não foi possível iniciar o pagamento. Tente novamente em instantes.",
  whatsappSendCode: "Não foi possível enviar o código pelo WhatsApp agora.",
  whatsappVerify: "Não foi possível verificar o código agora.",
  calendarLoad: "Não foi possível carregar suas agendas agora.",
  calendarSave: "Não foi possível conectar esta agenda. Verifique o endereço e tente novamente.",
  calendarRemove: "Não foi possível remover esta agenda agora.",
  listenFailed: "Não foi possível escutar agora.",
} as const;

const BY_CODE: Record<string, string> = {
  AUTH_REQUIRED: USER_MESSAGES.authRequired,
  UNAUTHENTICATED: USER_MESSAGES.authRequired,
  STRIPE_PRICE_MISSING: USER_MESSAGES.packageUnavailable,
  STRIPE_SECRET_MISSING: USER_MESSAGES.paymentsUnavailable,
  STRIPE_CHECKOUT_CREATE_FAILED: USER_MESSAGES.checkoutFailed,
  INVALID_PHONE: "Número inválido. Use DDD + número.",
  RATE_LIMITED: "Muitas tentativas. Aguarde alguns minutos.",
  TWILIO_SEND_FAILED: USER_MESSAGES.whatsappSendCode,
  VERIFY_STORE_FAILED: USER_MESSAGES.whatsappSendCode,
  INVALID_CODE: "O código tem 6 dígitos.",
  CODE_NOT_FOUND: "Código expirado. Solicite outro.",
  CODE_EXPIRED: "Código expirado. Solicite outro.",
  TOO_MANY_ATTEMPTS: "Muitas tentativas. Solicite um novo código.",
  CODE_MISMATCH: "Código inválido.",
  INVALID_PREDICTION_ID: "Não foi possível enviar esta previsão. Gere novamente e tente de novo.",
  INVALID_TTS_PREDICTION_ID: "Não foi possível gerar a narração desta previsão.",
  PREDICTION_NOT_FOUND: "Não encontramos esta previsão para envio.",
  EMPTY_WHATSAPP_MESSAGE: "Não há texto para enviar no WhatsApp.",
  TTS_QUOTA_EXCEEDED: "Limite de narração atingido no momento. Tente novamente em instantes.",
  TTS_EMPTY_AUDIO: USER_MESSAGES.listenFailed,
  TTS_PROVIDER_FAILED: USER_MESSAGES.listenFailed,
  STORAGE_UPLOAD_FAILED: USER_MESSAGES.listenFailed,
  STORAGE_SIGNED_URL_FAILED: USER_MESSAGES.listenFailed,
  NO_CREDITS: "Não há créditos disponíveis para reembolso.",
};

const UNSAFE_SNIPPETS = [
  "next_public_",
  "stripe_secret",
  "stripe_price_id",
  "price id",
  "faltam chaves",
  "password should",
  "invalid login",
  "jwt",
  "postgres",
  "permission denied",
  "row-level security",
  "does not exist",
  "econnrefused",
  "etimedout",
  "fetch failed",
  "notallowederror",
  "play()",
  "pricecents",
  "predictionid",
];

export type UserFacingErrorLike = {
  message?: string | null;
  error?: string | null;
  code?: string | null;
  name?: string | null;
} | null;

function asRecord(input: unknown): UserFacingErrorLike {
  if (!input) {
    return null;
  }

  if (typeof input === "string") {
    return { message: input };
  }

  if (typeof input !== "object") {
    return null;
  }

  const value = input as Record<string, unknown>;
  return {
    message: typeof value.message === "string" ? value.message : null,
    error: typeof value.error === "string" ? value.error : null,
    code: typeof value.code === "string" ? value.code : null,
    name: typeof value.name === "string" ? value.name : null,
  };
}

export function isUnsafeUserMessage(message: string) {
  const text = message.trim();
  if (!text || text.length > 180) {
    return true;
  }

  if (text.split(/\r?\n/).length > 2) {
    return true;
  }

  const lower = text.toLowerCase();
  if (UNSAFE_SNIPPETS.some((snippet) => lower.includes(snippet))) {
    return true;
  }

  if (/^[A-Z][A-Z0-9_]{3,}$/.test(text)) {
    return true;
  }

  if (/price_[a-zA-Z0-9]{8,}/.test(text) || /sk_live|sk_test|pk_live|pk_test/.test(text)) {
    return true;
  }

  return false;
}

export function toUserFacingMessage(input: unknown, fallback: string): string {
  const parsed = asRecord(input);
  const code = parsed?.code?.trim().toUpperCase() ?? "";
  if (code && BY_CODE[code]) {
    return BY_CODE[code];
  }

  const message = (parsed?.error ?? parsed?.message ?? "").trim();
  if (message && !isUnsafeUserMessage(message)) {
    return message;
  }

  return fallback;
}
