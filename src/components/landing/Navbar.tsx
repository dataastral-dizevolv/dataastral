"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

const links = [
  { label: "Calculadora", href: "#calculadora" },
  { label: "Como funciona", href: "#como-funciona" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const authNext = "/calculadora?resumePrediction=1#calculadora";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background border-b border-border/70" : "bg-transparent"
      }`}
    >
      <div className="flex h-16 w-full items-center justify-between px-6 lg:px-16">
        <a href="#" className="font-display text-xl italic tracking-tight text-iris-accent">
          DATA ASTRAL
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((item) => (
            <a key={item.href} href={item.href} className="font-body text-sm text-iris-secondary transition-colors hover:text-foreground">
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost" className="font-body text-sm text-iris-secondary hover:text-foreground">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="font-body text-xs uppercase tracking-wider">
            <Link href={`/cadastro?next=${encodeURIComponent(authNext)}`}>Comecar Gratis</Link>
          </Button>
        </div>

        <button className="text-foreground md:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label="Menu">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 border-b border-border/70 bg-background px-6 py-6 md:hidden"
        >
          {links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="font-body text-sm text-iris-secondary hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <Button asChild variant="ghost" onClick={() => setMobileOpen(false)} className="font-body text-sm text-iris-secondary hover:text-foreground">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild onClick={() => setMobileOpen(false)} className="font-body text-xs uppercase tracking-wider">
            <Link href={`/cadastro?next=${encodeURIComponent(authNext)}`}>Comecar Gratis</Link>
          </Button>
        </motion.div>
      )}
    </nav>
  );
}
