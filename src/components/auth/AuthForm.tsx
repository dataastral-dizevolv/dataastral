"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
};

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
    const redirectTo = nextPath?.startsWith("/") ? nextPath : "/dashboard";

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

  function handleGoogleMock() {
    setError(null);
    toast("Login com Google será habilitado em breve.");
  }

  return (
    <Card className="relative w-full max-w-md border border-iris-accent bg-iris-secondary/80 py-0 shadow-iris-card backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top right, hsl(var(--iris-accent-glow)), transparent 55%)",
        }}
      />

      <CardHeader className="relative gap-4 px-7 pt-7">
        <div className="space-y-2">
          <h1 className="font-display text-3xl tracking-tight text-iris-primary">{content.title}</h1>
          <p className="text-sm text-iris-secondary">{content.description}</p>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-5 px-7 pb-7">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full border-iris-accent bg-transparent font-body text-sm"
          onClick={handleGoogleMock}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Continuar com Google
        </Button>

        <div className="relative flex items-center justify-center">
          <span className="absolute inset-x-0 h-px bg-border" />
          <span className="relative bg-iris-secondary px-3 font-mono-iris text-[0.65rem] uppercase tracking-widest text-iris-muted">
            ou por email
          </span>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "cadastro" ? (
            <div className="space-y-2">
              <Label htmlFor="nome" className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-iris-muted">
                Nome completo
              </Label>
              <Input id="nome" name="nome" required placeholder="Seu nome" className="h-10 rounded-xl" />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email" className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-iris-muted">
              Email
            </Label>
            <Input id="email" name="email" type="email" required placeholder="voce@email.com" className="h-10 rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha" className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-iris-muted">
              Senha
            </Label>
            <Input id="senha" name="senha" type="password" required placeholder="••••••••" className="h-10 rounded-xl" />
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
                className="h-10 rounded-xl"
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
      </CardContent>
    </Card>
  );
}
