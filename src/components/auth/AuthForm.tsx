"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidReferralCodeFormat, REFERRAL_COOKIE } from "@/lib/referrals";
import { tryCreateClient } from "@/lib/supabase/client";

type AuthMode = "login" | "cadastro";

interface AuthFormProps {
  mode: AuthMode;
}

const copyByMode = {
  login: {
    title: "Boas vindas de volta!",
    description: "Entre para continuar sua jornada.",
    submit: "Entrar",
    switchLabel: "Ainda não tem conta?",
    switchAction: "Criar conta",
    switchHref: "/cadastro",
    googleLabel: "Entrar com Google",
  },
  cadastro: {
    title: "Criar conta",
    description: "Cadastre-se para acessar mapa astral, planner e meus dados.",
    submit: "Criar conta",
    switchLabel: "Já tem conta?",
    switchAction: "Clique aqui — Entrar",
    switchHref: "/login",
    googleLabel: "Cadastrar com Google",
  },
} as const;

const AUTH_MESSAGES = {
  loginFailed: "Não foi possível entrar. Verifique suas credenciais e tente novamente.",
  signupFailed: "Não foi possível criar sua conta agora. Tente novamente em instantes.",
  googleFailed: "Não foi possível entrar com Google. Tente novamente.",
};

const tapFx = "transition-all active:scale-[0.98] active:opacity-80 duration-150";

function getSafeRedirectPath(rawNext: string | null) {
  if (!rawNext) {
    return "/dashboard";
  }

  const value = rawNext.trim();

  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/dashboard";
  }

  try {
    const url = new URL(value, window.location.origin);

    if (url.origin !== window.location.origin) {
      return "/dashboard";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}

function readReferralCode(searchParams: URLSearchParams) {
  const raw = searchParams.get("ref")?.trim().toUpperCase() ?? "";
  return isValidReferralCodeFormat(raw) ? raw : "";
}

function persistReferralCookie(code: string) {
  if (!code) {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${REFERRAL_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=${60 * 60 * 24 * 14}; SameSite=Lax${secure}`;
}

async function attributeReferralIfNeeded(code: string) {
  if (!code) {
    return;
  }

  try {
    await fetch("/api/referrals/attribute", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  } catch {
    // Atribuição é best-effort; o trigger/metadata e o callback cobrem o fluxo principal.
  }
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.48-1.12 2.73-2.39 3.58v2.98h3.86c2.26-2.09 3.58-5.17 3.58-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.93l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBlocked = searchParams.get("blocked") === "1";
  const referralCode = useMemo(() => readReferralCode(searchParams), [searchParams]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const content = useMemo(() => copyByMode[mode], [mode]);

  const switchHref = useMemo(() => {
    const params = new URLSearchParams();
    const next = searchParams.get("next");
    if (next) {
      params.set("next", next);
    }
    if (referralCode) {
      params.set("ref", referralCode);
    }
    const query = params.toString();
    return query ? `${content.switchHref}?${query}` : content.switchHref;
  }, [content.switchHref, referralCode, searchParams]);

  useEffect(() => {
    if (referralCode) {
      persistReferralCookie(referralCode);
    }
  }, [referralCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const nome = String(formData.get("nome") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const senha = String(formData.get("senha") ?? "");
    const confirmarSenha = String(formData.get("confirmarSenha") ?? "");
    const supabase = tryCreateClient();
    if (!supabase) {
      setError(mode === "login" ? AUTH_MESSAGES.loginFailed : AUTH_MESSAGES.signupFailed);
      setLoading(false);
      return;
    }

    if (mode === "cadastro" && senha !== confirmarSenha) {
      setError("As senhas precisam ser iguais para continuar.");
      setLoading(false);
      return;
    }

    if (mode === "cadastro" && nome.length === 0) {
      setError("Informe seu nome completo para criar a conta.");
      setLoading(false);
      return;
    }

    const nextPath = new URLSearchParams(window.location.search).get("next");
    const redirectTo = getSafeRedirectPath(nextPath);

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (signInError) {
        setError(AUTH_MESSAGES.loginFailed);
        setLoading(false);
        return;
      }

      await attributeReferralIfNeeded(referralCode);
      router.push(redirectTo);
      setLoading(false);
      return;
    }

    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          full_name: nome,
          ...(referralCode ? { referral_code: referralCode } : {}),
        },
      },
    });

    if (signUpError) {
      setError(AUTH_MESSAGES.signupFailed);
      setLoading(false);
      return;
    }

    if (!data.session) {
      toast.success("Conta criada. Verifique seu e-mail para confirmar o acesso.");
      const loginParams = new URLSearchParams();
      loginParams.set("next", redirectTo);
      if (referralCode) {
        loginParams.set("ref", referralCode);
      }
      router.push(`/login?${loginParams.toString()}`);
      setLoading(false);
      return;
    }

    await attributeReferralIfNeeded(referralCode);
    toast.success("Conta criada com sucesso.");
    router.push(redirectTo);
    setLoading(false);
  }

  async function handleGoogleAuth() {
    setError(null);
    setLoading(true);
    const supabase = tryCreateClient();
    if (!supabase) {
      setError(AUTH_MESSAGES.googleFailed);
      setLoading(false);
      return;
    }
    const nextPath = new URLSearchParams(window.location.search).get("next");
    const redirectTo = getSafeRedirectPath(nextPath);

    if (referralCode) {
      persistReferralCookie(referralCode);
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (oauthError) {
      setError(AUTH_MESSAGES.googleFailed);
      setLoading(false);
    }
  }

  return (
    <section className="w-full">
      {isBlocked ? (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3">
          <p className="text-xs text-destructive">Sua conta foi desativada. Entre em contato com o suporte.</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card/40 p-7 shadow-card-soft backdrop-blur-sm">
        <div className="mb-6">
          <h1 className="font-jakarta text-2xl font-black text-foreground">{content.title}</h1>
          <p className="mt-1 text-sm text-foreground/60">{content.description}</p>
          {mode === "cadastro" && referralCode ? (
            <p className="mt-2 text-xs text-foreground/50">Você chegou por indicação — quem te convidou ganha pontos quando você concluir o cadastro.</p>
          ) : null}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "cadastro" ? (
            <div>
              <Label htmlFor="nome" className="text-sm text-foreground">
                Nome completo
              </Label>
              <Input id="nome" name="nome" required placeholder="Seu nome" className="mt-1.5 h-10 bg-background" />
            </div>
          ) : null}

          <div>
            <Label htmlFor="email" className="text-sm text-foreground">
              E-mail
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="voce@exemplo.com"
              className="mt-1.5 h-10 bg-background"
            />
          </div>

          <div>
            <Label htmlFor="senha" className="text-sm text-foreground">
              Senha
            </Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              required
              placeholder="••••••••"
              className="mt-1.5 h-10 bg-background"
            />
          </div>

          {mode === "cadastro" ? (
            <div>
              <Label htmlFor="confirmarSenha" className="text-sm text-foreground">
                Confirmar senha
              </Label>
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                required
                placeholder="Repita a senha"
                className="mt-1.5 h-10 bg-background"
              />
            </div>
          ) : null}

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <Button
            type="submit"
            disabled={loading}
            className={`h-11 w-full bg-foreground font-jakarta text-sm font-bold text-background hover:bg-foreground/90 ${tapFx}`}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {content.submit}
          </Button>

          <div className="relative my-2 flex items-center">
            <div className="flex-1 border-t border-border" />
            <span className="px-3 text-xs uppercase tracking-wider text-foreground/50">ou</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className={`h-11 w-full gap-3 border-border bg-background text-sm font-medium text-foreground hover:bg-muted ${tapFx}`}
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
            {content.googleLabel}
          </Button>
        </form>

        <div className="mt-6 border-t border-border pt-5 text-center text-sm text-foreground/70">
          {content.switchLabel}{" "}
          <Link
            href={switchHref}
            className="font-medium text-iris-accent underline underline-offset-4 transition-colors hover:opacity-80"
          >
            {content.switchAction}
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-foreground/40">
        Você pode explorar o site sem entrar.
        <br />
        Login só é necessário para mapa astral, meus dados e planner.
      </p>
    </section>
  );
}
