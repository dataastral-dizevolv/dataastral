"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Search,
  User,
  Instagram,
  Mail,
  Linkedin,
  MessageCircle,
  LogOut,
  LogIn,
} from "lucide-react";
import BrandIcon from "@/components/brand/BrandIcon";
import { tryCreateClient } from "@/lib/supabase/client";

interface FullScreenMenuProps {
  open: boolean;
  onClose: () => void;
}

const FullScreenMenu = ({ open, onClose }: FullScreenMenuProps) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const go = (path: string) => {
    onClose();
    if (path.includes("#")) {
      const [base, hash] = path.split("#");
      const targetPath = base || "/";
      if (typeof window !== "undefined" && window.location.pathname === (targetPath || "/")) {
        // Defer scroll until menu close animation finishes
        window.setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
        }, 280);
        return;
      }
    }
    router.push(path);
  };

  const handleAuthAction = async () => {
    onClose();
    if (userEmail) {
      const supabase = tryCreateClient();
      await supabase?.auth.signOut();
      router.push("/");
    } else {
      router.push("/login");
    }
  };

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userEmail) {
      setIsAdmin(false);
      return;
    }

    let cancelled = false;

    fetch("/api/dashboard/me", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { role?: string } | null) => {
        if (!cancelled) {
          setIsAdmin(data?.role === "admin");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsAdmin(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  const items: { label: string; path: string; authAction?: boolean }[] = [
    { label: "Começar previsão", path: "/previsao-com-data" },
    { label: "Mapa Astral", path: "/mapa-astral" },
    { label: "Painel Astral", path: "/painel-astral" },
    { label: "Aulas", path: "/aula" },
    { label: "Relacionamentos", path: "/mapa-astral" },
    { label: "Calculadora", path: "/calculadora" },
    { label: "Dashboard", path: "/dashboard" },
    { label: "Calendário", path: "/calendario" },
    { label: "Financeiro", path: "/financeiro" },
    { label: "Perfil", path: "/perfil" },
    { label: "Planos", path: "/precos" },

    ...(isAdmin ? [{ label: "Admin", path: "/admin" }] : []),
    {
      label: userEmail ? "Deslogar" : "Fazer login",
      path: userEmail ? "/" : "/login",
      authAction: true,
    },
  ];

  const filtered = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[100] flex flex-col bg-[hsl(var(--blackout))] text-white"
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <button
              onClick={onClose}
              aria-label="Fechar menu"
              className="p-1 text-iris-blue-chambray transition-colors hover:text-white/80"
            >
              <X className="h-6 w-6" strokeWidth={1.5} />
            </button>

            <button
              onClick={() => go("/")}
              aria-label="Data Iris"
              className="transition-opacity hover:opacity-70"
            >
              <BrandIcon className="h-16 w-16 sm:h-20 sm:w-20" surface="dark" tone="brand" />
            </button>

            <button
              onClick={() => go("/perfil")}
              aria-label="Perfil"
              className="p-1 text-iris-blue-chambray transition-colors hover:text-white/80"
            >
              <User className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>

          <div className="px-5 pt-2 pb-3">
            <div className="flex items-center gap-3 rounded-full px-4 h-11 border border-iris-blue-chambray/25">
              <Search className="h-4 w-4 text-iris-blue-chambray/60" strokeWidth={1.75} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar página, serviço ou tema"
                className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-white/40 text-white"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Limpar"
                  className="text-iris-blue-chambray/60 hover:text-iris-blue-chambray transition-colors"
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>

          <nav className="px-6 flex flex-col items-start pt-2 pb-0">
            <ul className="flex flex-col items-start w-full">
              {filtered.map((item, i) => (
                <motion.li
                  key={item.path + i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.04 + i * 0.04,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="w-full border-b last:border-b-0"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                >
                  <button
                    onClick={() => {
                      if (item.authAction) {
                        void handleAuthAction();
                        return;
                      }
                      if (item.path.startsWith("#")) {
                        onClose();
                        document.getElementById(item.path.slice(1))?.scrollIntoView({
                          behavior: "smooth",
                        });
                        return;
                      }
                      go(item.path);
                    }}
                    className="font-jakarta font-black w-full text-left text-[24px] sm:text-[32px] md:text-[38px] leading-[1.1] tracking-[-0.02em] py-3 text-white transition-colors hover:text-iris-blue-chambray flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    {item.authAction &&
                      (userEmail ? (
                        <LogOut className="h-5 w-5 sm:h-6 sm:w-6 opacity-70" strokeWidth={1.5} />
                      ) : (
                        <LogIn className="h-5 w-5 sm:h-6 sm:w-6 opacity-70" strokeWidth={1.5} />
                      ))}
                  </button>
                </motion.li>
              ))}
            </ul>
          </nav>

          <div
            className="border-t px-6 pt-2 pb-3 flex flex-col items-center gap-2 mt-auto"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <p className="text-[11px] uppercase tracking-[0.22em] opacity-60 text-iris-blue-chambray">
              Siga-nos
            </p>
            <div className="flex items-center justify-center gap-6 text-iris-blue-chambray">
              <a
                href="https://instagram.com/metodoiris"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-white/80 transition-colors"
              >
                <Instagram className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="hover:text-white/80 transition-colors"
              >
                <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a
                href="https://www.linkedin.com/company/metodo-iris"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="hover:text-white/80 transition-colors"
              >
                <Linkedin className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a
                href="mailto:contato@metodoiris.com"
                aria-label="E-mail"
                className="hover:text-white/80 transition-colors"
              >
                <Mail className="w-5 h-5" strokeWidth={1.5} />
              </a>
            </div>
            <div className="w-full flex items-center justify-between pt-1">
              <div className="flex flex-col leading-tight">
                <span className="font-jakarta font-black text-[13px] tracking-[-0.01em] text-white">
                  Data Iris
                </span>
                <span
                  className="font-ubuntu font-thin text-[10px] tracking-[0.14em] uppercase mt-0.5"
                  style={{ color: "hsl(var(--blue-chambray))" }}
                >
                  DATA IRIS Astro planner agent
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullScreenMenu;
