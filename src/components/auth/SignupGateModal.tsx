"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { tryCreateClient } from "@/lib/supabase/client";

interface SignupGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  nextPath: string;
}

export function SignupGateModal({ open, onOpenChange, onSuccess, nextPath }: SignupGateModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || password.length < 6) {
      toast.error("Email válido e senha de 6+ caracteres.");
      return;
    }
    if (mode === "signup" && nome.trim().length === 0) {
      toast.error("Informe seu nome para criar a conta.");
      return;
    }

    setLoading(true);
    const supabase = tryCreateClient();
    if (!supabase) {
      toast.error("Não foi possível conectar ao serviço de autenticação.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: nome.trim() } },
      });
      setLoading(false);
      if (error) {
        toast.error("Não foi possível criar sua conta agora.");
        return;
      }
      if (!data.session) {
        toast.success("Conta criada. Verifique seu e-mail para confirmar o acesso.");
        onOpenChange(false);
        return;
      }
      toast.success("Conta criada!");
      onSuccess();
      onOpenChange(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível entrar. Verifique suas credenciais.");
      return;
    }
    toast.success("Bem-vindo de volta!");
    onSuccess();
    onOpenChange(false);
  };

  const google = async () => {
    setLoading(true);
    const supabase = tryCreateClient();
    if (!supabase) {
      toast.error("Não foi possível conectar ao serviço de autenticação.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (error) {
      toast.error("Não foi possível entrar com Google.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-jakarta text-xl font-extrabold">
            {mode === "signup" ? "Crie sua conta para continuar" : "Entre para continuar"}
          </DialogTitle>
          <DialogDescription>
            {mode === "signup"
              ? "Você já usou suas perguntas grátis. Cadastre-se para continuar com créditos na sua conta."
              : "Seus dados foram mantidos. Entre para gerar a previsão."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => void google()}
            disabled={loading}
            className="h-11 w-full rounded-full border border-border bg-background text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            Continuar com Google
          </button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            ou
            <div className="h-px flex-1 bg-border" />
          </div>

          {mode === "signup" ? (
            <Input placeholder="Seu nome" value={nome} onChange={(event) => setNome(event.target.value)} />
          ) : null}
          <Input type="email" placeholder="seu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input
            type="password"
            placeholder="Senha (mínimo 6 caracteres)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading}
            className="h-11 w-full rounded-full bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "..." : mode === "signup" ? "Criar conta" : "Entrar"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="w-full text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {mode === "signup" ? "Já tenho conta" : "Quero criar uma conta"}
          </button>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href={`/login?next=${encodeURIComponent(nextPath)}`}
              className="inline-flex h-10 items-center justify-center rounded-full border border-border text-xs tracking-wider uppercase"
            >
              Página de login
            </Link>
            <Link
              href={`/cadastro?next=${encodeURIComponent(nextPath)}`}
              className="inline-flex h-10 items-center justify-center rounded-full border border-border text-xs tracking-wider uppercase"
            >
              Página de cadastro
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
