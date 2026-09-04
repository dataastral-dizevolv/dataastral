"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import FullScreenMenu from "@/components/landing/FullScreenMenu";
import BrandIcon from "@/components/brand/BrandIcon";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent border-b border-transparent">
        <nav className="relative flex items-center justify-between px-4 lg:px-8 h-11 md:h-14">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push("/")}
              aria-label="Data Iris"
              className="transition-opacity duration-200 hover:opacity-80 flex items-center gap-2"
            >
              <BrandIcon alt="Data Iris" variant="pastel" className="h-6 w-6 md:h-8 md:w-8" />
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              className="p-1 md:p-1.5 flex items-center justify-center text-[hsl(var(--text-pastel))] transition-colors hover:text-iris-blue-chambray"
            >
              <Menu className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2} />
            </button>
          </div>
        </nav>
      </header>

      <FullScreenMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
};

export default Header;
