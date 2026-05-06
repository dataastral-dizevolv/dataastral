export default function Footer() {
  return (
    <footer className="border-t border-iris bg-background py-16">
      <div className="w-full px-6 lg:px-16">
        <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <span className="font-display text-xl italic text-iris-accent">DATA ASTRAL</span>
            <p className="font-body text-sm leading-relaxed text-iris-secondary">Geometria celeste para decisoes precisas.</p>
          </div>

          <div className="space-y-3">
            <p className="font-mono-iris text-[10px] uppercase tracking-widest text-iris-muted">Produto</p>
            <div className="flex flex-col gap-2">
              <a href="#calculadora" className="font-body text-sm text-iris-secondary transition-colors hover:text-foreground">
                Calculadora
              </a>
              <a href="#como-funciona" className="font-body text-sm text-iris-secondary transition-colors hover:text-foreground">
                Como funciona
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-mono-iris text-[10px] uppercase tracking-widest text-iris-muted">Empresa</p>
            <div className="flex flex-col gap-2">
              <a href="#" className="font-body text-sm text-iris-secondary transition-colors hover:text-foreground">
                Sobre
              </a>
              <a href="#" className="font-body text-sm text-iris-secondary transition-colors hover:text-foreground">
                Blog
              </a>
              <a href="#" className="font-body text-sm text-iris-secondary transition-colors hover:text-foreground">
                Contato
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-mono-iris text-[10px] uppercase tracking-widest text-iris-muted">Redes</p>
            <div className="flex flex-col gap-2">
              <a href="#" className="font-body text-sm text-iris-secondary transition-colors hover:text-foreground">
                Instagram
              </a>
              <a href="#" className="font-body text-sm text-iris-secondary transition-colors hover:text-foreground">
                WhatsApp
              </a>
              <a href="#" className="font-body text-sm text-iris-secondary transition-colors hover:text-foreground">
                Email
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-iris pt-6 sm:flex-row">
          <p className="font-body text-xs text-iris-muted">(c) 2026 Data Astral - Swiss Ephemeris</p>
          <div className="flex gap-4">
            <a href="#" className="font-body text-xs text-iris-muted transition-colors hover:text-iris-secondary">
              Privacidade
            </a>
            <a href="#" className="font-body text-xs text-iris-muted transition-colors hover:text-iris-secondary">
              Termos
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
