export const MIN_PASSWORD_LENGTH = 6;

export const AUTH_MESSAGES = {
  loginFailed: "Não foi possível entrar. Verifique suas credenciais e tente novamente.",
  invalidCredentials: "E-mail ou senha incorretos.",
  emailNotConfirmed: "Confirme seu e-mail para entrar. Verifique sua caixa de entrada.",
  rateLimited: "Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.",
  signupFailed: "Não foi possível criar sua conta agora. Tente novamente em instantes.",
  googleFailed: "Não foi possível entrar com Google. Tente novamente.",
  authUnavailable: "Não foi possível conectar agora. Tente novamente em instantes.",
  passwordTooShort: "A senha precisa ter pelo menos 6 caracteres.",
  passwordMismatch: "As senhas precisam ser iguais para continuar.",
  passwordSameAsCurrent: "A nova senha precisa ser diferente da atual.",
  passwordUpdateFailed: "Não foi possível atualizar a senha agora. Tente novamente em instantes.",
  sessionExpired: "Sua sessão expirou. Entre novamente para continuar.",
  nameRequired: "Informe seu nome completo para criar a conta.",
  emailAlreadyRegistered: "Este e-mail já possui uma conta. Entre ou use outro e-mail.",
  invalidEmail: "Informe um e-mail válido para criar a conta.",
} as const;

export type AuthErrorLike = {
  message?: string | null;
  code?: string | null;
  name?: string | null;
} | null;

function readAuthError(error: AuthErrorLike) {
  return {
    code: error?.code?.toLowerCase() ?? "",
    message: error?.message?.toLowerCase() ?? "",
    name: error?.name?.toLowerCase() ?? "",
  };
}

function isWeakPasswordError(error: AuthErrorLike) {
  const { code, message, name } = readAuthError(error);

  return (
    code === "weak_password" ||
    name === "authweakpassworderror" ||
    message.includes("password should be at least") ||
    message.includes("password is known to be weak")
  );
}

function isRateLimitedError(error: AuthErrorLike) {
  const { code, message } = readAuthError(error);

  return (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("for security purposes")
  );
}

export function getSignupPasswordError(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return AUTH_MESSAGES.passwordTooShort;
  }

  return null;
}

export function mapSignupError(error: AuthErrorLike): string {
  const { code, message } = readAuthError(error);

  if (isWeakPasswordError(error)) {
    return AUTH_MESSAGES.passwordTooShort;
  }

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes("already registered") ||
    message.includes("already been registered")
  ) {
    return AUTH_MESSAGES.emailAlreadyRegistered;
  }

  if (
    code === "email_address_invalid" ||
    message.includes("unable to validate email") ||
    (code === "validation_failed" && message.includes("email"))
  ) {
    return AUTH_MESSAGES.invalidEmail;
  }

  if (isRateLimitedError(error)) {
    return AUTH_MESSAGES.rateLimited;
  }

  return AUTH_MESSAGES.signupFailed;
}

export function mapLoginError(error: AuthErrorLike): string {
  const { code, message } = readAuthError(error);

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return AUTH_MESSAGES.emailNotConfirmed;
  }

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return AUTH_MESSAGES.invalidCredentials;
  }

  if (isRateLimitedError(error)) {
    return AUTH_MESSAGES.rateLimited;
  }

  return AUTH_MESSAGES.loginFailed;
}

export function mapPasswordUpdateError(error: AuthErrorLike): string {
  const { code, message, name } = readAuthError(error);

  if (isWeakPasswordError(error)) {
    return AUTH_MESSAGES.passwordTooShort;
  }

  if (code === "same_password" || message.includes("same password") || message.includes("should be different")) {
    return AUTH_MESSAGES.passwordSameAsCurrent;
  }

  if (
    code === "session_not_found" ||
    name === "authsessionmissingerror" ||
    (message.includes("session") && message.includes("missing")) ||
    message.includes("not authenticated") ||
    message.includes("auth session missing")
  ) {
    return AUTH_MESSAGES.sessionExpired;
  }

  return AUTH_MESSAGES.passwordUpdateFailed;
}
