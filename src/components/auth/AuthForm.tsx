"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "cadastro";

interface AuthFormProps {
  mode: AuthMode;
}

const copyByMode = {
  login: {
    title: "Entrar na plataforma",
    description: "Acesse sua conta para continuar suas previsões.",
    submit: "Entrar",
    switchLabel: "Ainda não tem conta?",
    switchAction: "Criar conta",
    switchHref: "/cadastro",
  },
  cadastro: {
    title: "Criar conta",
    description: "Comece com seu acesso para salvar perguntas e previsões.",
    submit: "Criar conta",
    switchLabel: "Já tem conta?",
    switchAction: "Fazer login",
    switchHref: "/login",
  },
} as const;

const AUTH_MESSAGES = {
  loginFailed: "Não foi possível entrar. Verifique suas credenciais e tente novamente.",
  signupFailed: "Não foi possível criar sua conta agora. Tente novamente em instantes.",
  googleFailed: "Não foi possível entrar com Google. Tente novamente.",
};

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

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21.35 11.1H12v2.98h5.33c-.23 1.5-1.07 2.77-2.28 3.62v2.4h3.69c2.16-1.99 3.41-4.93 3.41-8.1 0-.69-.06-1.36-.18-2.01Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.69-2.4c-1.03.69-2.35 1.1-3.94 1.1-3.03 0-5.6-2.05-6.52-4.8H.67v2.48A9.996 9.996 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M4.48 13.46A5.997 5.997 0 0 1 4.14 12c0-.51.09-1 .24-1.46V8.06H.67A9.996 9.996 0 0 0 0 12c0 1.61.39 3.14 1.08 4.46l3.4-2.99Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.75c1.47 0 2.8.51 3.84 1.5l2.88-2.88C16.97 2.75 14.7 2 12 2 8.07 2 4.67 4.24 2.98 7.54l3.71 2.98c.92-2.76 3.49-4.77 5.31-4.77Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const content = useMemo(() => copyByMode[mode], [mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const nome = String(formData.get("nome") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const senha = String(formData.get("senha") ?? "");
    const confirmarSenha = String(formData.get("confirmarSenha") ?? "");
    const supabase = createClient();

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
      router.push(`/login?next=${encodeURIComponent(redirectTo)}`);
      setLoading(false);
      return;
    }

    toast.success("Conta criada com sucesso.");
    router.push(redirectTo);
    setLoading(false);
  }

  async function handleGoogleAuth() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const nextPath = new URLSearchParams(window.location.search).get("next");
    const redirectTo = getSafeRedirectPath(nextPath);

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
    <section className="w-full max-w-md space-y-6 border-b border-border/70 pb-6">
      <header className="space-y-2 border-b border-border/70 pb-4">
        <div className="space-y-2">
          <h1 className="font-display text-3xl tracking-tight text-foreground">{content.title}</h1>
          <p className="text-sm text-muted-foreground">{content.description}</p>
        </div>
      </header>

      <div className="space-y-5">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full border-iris-accent bg-transparent font-body text-sm"
          onClick={handleGoogleAuth}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
          {mode === "login" ? "Entrar com Google" : "Continuar com Google"}
        </Button>

        <div className="relative flex items-center justify-center">
          <span className="absolute inset-x-0 h-px bg-border" />
          <span className="relative bg-background px-3 font-mono-iris text-[0.65rem] uppercase tracking-widest text-iris-muted">
            ou continue com email
          </span>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "cadastro" ? (
            <div className="space-y-2">
              <Label htmlFor="nome" className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-iris-muted">
                Nome completo
              </Label>
              <Input id="nome" name="nome" required placeholder="Seu nome" className="h-10" />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email" className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-iris-muted">
              Email
            </Label>
            <Input id="email" name="email" type="email" required placeholder="voce@email.com" className="h-10" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha" className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-iris-muted">
              Senha
            </Label>
            <Input id="senha" name="senha" type="password" required placeholder="••••••••" className="h-10" />
          </div>

          {mode === "cadastro" ? (
            <div className="space-y-2">
              <Label
                htmlFor="confirmarSenha"
                className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-iris-muted"
              >
                Confirmar senha
              </Label>
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                required
                placeholder="Repita a senha"
                className="h-10"
              />
            </div>
          ) : null}

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <Button type="submit" className="h-10 w-full font-body text-xs uppercase tracking-wider" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {content.submit}
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <p className="text-center text-sm text-iris-secondary">
          {content.switchLabel}{" "}
          <Link href={content.switchHref} className="font-medium text-iris-accent transition-colors hover:text-foreground">
            {content.switchAction}
          </Link>
        </p>
      </div>
    </section>
  );
}
