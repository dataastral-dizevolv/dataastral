"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Instagram, Mail, Linkedin, MessageCircle, LogOut, LogIn } from "lucide-react";
import BrandIcon from "@/components/brand/BrandIcon";
import { tryCreateClient } from "@/lib/supabase/client";

const Footer = ({
  extraSlot,
  minimal,
}: {
  extraSlot?: React.ReactNode;
  minimal?: boolean;
}) => {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const supabase = tryCreateClient();
    if (!supabase) {
      setUserEmail(null);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleAuthAction = async () => {
    if (userEmail) {
      const supabase = tryCreateClient();
      await supabase?.auth.signOut();
      router.push("/");
    } else {
      router.push("/login");
    }
    window.scrollTo(0, 0);
  };

  const primary = [
    { label: "Meus Dados", path: "/perfil" },
    {
      label: userEmail ? "Deslogar" : "Fazer login",
      path: "#",
      onClick: handleAuthAction,
    },
    { label: "Começar", path: "/cadastro" },
    { label: "Mapa Astral", path: "/mapa-astral" },
    { label: "Painel Astral", path: "/painel-astral" },
    { label: "Aulas", path: "/aula" },
    { label: "Calculadora", path: "/#calculadora" },
    { label: "Dashboard", path: "/dashboard" },
  ];

  const legal = [
    { label: "Termos de Uso", path: "/termos-de-uso" },
    { label: "Política de Privacidade", path: "/politica-de-privacidade" },
    { label: "Reembolso", path: "/reembolso" },
  ];

  const go = (path: string) => {
    if (path.includes("#")) {
      const [base, hash] = path.split("#");
      const targetPath = base || "/";
      if (typeof window !== "undefined" && window.location.pathname === (targetPath || "/")) {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    if (path.startsWith("#")) {
      document.getElementById(path.slice(1))?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    router.push(path);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="relative border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 md:py-12 flex flex-col gap-8">
        {extraSlot}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6">
          <div className="lg:col-span-4 flex flex-col gap-5">
            <button
              onClick={() => go("/")}
              className="flex items-center gap-2 group self-start"
              aria-label="Data Iris"
            >
              <BrandIcon surface="light" tone="brand" className="h-7 w-7 select-none" alt="Data Iris" />
              <span className="font-ubuntu font-bold text-[15px] tracking-[-0.01em] text-foreground group-hover:opacity-70 transition-opacity">
                Data Iris
              </span>
            </button>

            {!minimal && (
              <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
                Astrologia prática, ética e com datas reais para você decidir com mais clareza.
              </p>
            )}
          </div>

          {!minimal && (
            <>
              <div className="lg:col-span-4 flex flex-col">
                <nav className="grid grid-cols-2 items-start gap-x-4 gap-y-1 leading-none">
                  {primary.map((l) => (
                    <button
                      key={l.label}
                      onClick={() => (l.onClick ? void l.onClick() : go(l.path))}
                      className="text-[13px] leading-[1.35] py-[1px] font-medium text-muted-foreground hover:text-foreground transition-colors tracking-[-0.005em] text-left flex items-center gap-1.5"
                    >
                      {l.label === "Deslogar" && (
                        <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                      )}
                      {l.label === "Fazer login" && (
                        <LogIn className="w-3.5 h-3.5" strokeWidth={1.75} />
                      )}
                      {l.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="lg:col-span-4 flex flex-col justify-end items-start">
                <div className="flex items-center gap-3">
                  <a
                    href="https://instagram.com/metodoiris"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Instagram className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  </a>
                  <a
                    href="https://wa.me/5511999999999"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/metodo-iris"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Linkedin className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  </a>
                  <a
                    href="mailto:contato@metodoiris.com"
                    aria-label="E-mail"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4 pt-6 border-t border-border/60">
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {legal.map((l) => (
              <button
                key={l.label}
                onClick={() => go(l.path)}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </button>
            ))}
          </nav>
          <p className="text-[11px]" style={{ color: "hsl(var(--text-tertiary))" }}>
            © {currentYear} Data Iris · R. Pais Leme 215, São Paulo BR
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
