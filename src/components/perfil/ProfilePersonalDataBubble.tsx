"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MapPin, MessageCircle, Plus, Search, X } from "lucide-react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";

import { DASHBOARD_ME_KEY, useDashboardUser } from "@/components/dashboard/DashboardUserContext";
import { ChatBubble } from "@/components/iris-chat/ChatBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { toUserFacingMessage } from "@/lib/errors/user-facing";
import { createClient } from "@/lib/supabase/client";
import type { LocationData } from "@/types/calculator";

const BUBBLE_CLASS =
  "!bg-iris-blue-chambray !border-iris-blue-chambray text-iris-blue-ink text-[15px] sm:text-[17px] font-black";

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <p className="font-jakarta text-[12px] font-black uppercase tracking-[0.22em] text-current sm:text-[13px]">
      {index} · {title}
    </p>
  );
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizeTime(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

export function ProfilePersonalDataBubble() {
  const router = useRouter();
  const { user } = useDashboardUser();
  const { mutate } = useSWRConfig();
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [fullName, setFullName] = useState(user.nome);
  const [birthDate, setBirthDate] = useState(user.birthDate ?? "");
  const [birthTime, setBirthTime] = useState(normalizeTime(user.birthTime));
  const [phoneCountry, setPhoneCountry] = useState(user.phoneCountry ?? "+55");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(user.whatsapp ?? "");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const existingLocation = useMemo<LocationData | null>(() => {
    if (!user.birthLocation || !user.birthTimezone || user.birthLat == null || user.birthLng == null) {
      return null;
    }

    const parts = user.birthLocation.split(",").map((part) => part.trim());

    return {
      city: parts[0] || "Cidade",
      state: parts[1] || "Estado",
      country: parts[2] || "País",
      lat: user.birthLat,
      lng: user.birthLng,
      timezone: user.birthTimezone,
      displayName: user.birthLocation,
    };
  }, [user.birthLat, user.birthLng, user.birthLocation, user.birthTimezone]);

  const {
    placeQuery,
    setPlaceQuery,
    locationResults,
    locationLoading,
    locationOpen,
    setLocationOpen,
    selectedLocation,
    handleSelectLocation,
  } = useLocationSearch({
    initialQuery: user.birthLocation ?? "",
    initialLocation: existingLocation,
  });

  async function handleSave() {
    if (birthDate.length > 0 && !isValidDate(birthDate)) {
      toast.error("Informe uma data válida no formato AAAA-MM-DD.");
      return;
    }

    if (birthTime.length > 0 && !isValidTime(birthTime)) {
      toast.error("Informe a hora no formato HH:mm.");
      return;
    }

    const locationFilled = placeQuery.trim().length > 0;

    if (locationFilled && !selectedLocation) {
      setLocationError("Selecione uma opção da lista para confirmar local e timezone.");
      return;
    }

    if (selectedLocation && !selectedLocation.timezone) {
      setLocationError("Não foi possível confirmar o timezone. Escolha outra opção.");
      return;
    }

    setSaving(true);
    setLocationError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          birthDate,
          birthTime,
          birthLocation: selectedLocation?.displayName ?? "",
          birthTimezone: selectedLocation?.timezone ?? "",
          birthLat: selectedLocation?.lat ?? null,
          birthLng: selectedLocation?.lng ?? null,
          phone,
          phoneCountry,
          whatsapp,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(toUserFacingMessage(payload, "Não foi possível salvar seu perfil agora."));
        return;
      }

      await mutate(DASHBOARD_ME_KEY);
      toast.success("Perfil atualizado com sucesso.");
    } catch {
      toast.error("Falha de conexão ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Não foi possível sair agora.");
      return;
    }

    toast.success("Sessão encerrada.");
    router.push("/login");
    router.refresh();
  }

  return (
    <ChatBubble id="profile-birth-data" from="iris" className={BUBBLE_CLASS}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <SectionLabel index="01" title="Dados pessoais" />
            <h2 className="font-jakarta text-[20px] font-black uppercase leading-[1.2] tracking-[0.01em] sm:text-[26px] md:text-[28px]">
              Editar
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsDataOpen((value) => !value)}
            aria-label={isDataOpen ? "Fechar dados" : "Abrir dados"}
            className="flex size-10 items-center justify-center rounded-full border border-foreground/10 text-foreground transition-colors hover:bg-foreground/5"
          >
            {isDataOpen ? <X className="size-5" /> : <Plus className="size-5" />}
          </button>
        </div>

        {isDataOpen ? (
          <>
            <div className="divide-y divide-foreground/10 border-y border-foreground/10">
              <div className="flex items-center justify-between gap-3 py-3 text-sm font-normal">
                <span className="text-muted-foreground">Celular</span>
                <span className="text-foreground">
                  {phoneCountry} {phone || "—"}
                </span>
              </div>
              <FieldRow label="Apelido">
                <Input
                  type="text"
                  value={fullName}
                  placeholder="Seu nome"
                  onChange={(event) => setFullName(event.target.value)}
                  className="h-9 flex-1 rounded-xl border border-foreground/10 bg-milky-way px-3 text-right text-milky-way-foreground focus-visible:ring-0"
                />
              </FieldRow>
              <FieldRow label="E-mail">
                <Input
                  type="email"
                  value={user.email}
                  readOnly
                  disabled
                  className="h-9 flex-1 rounded-xl border border-foreground/10 bg-milky-way px-3 text-right text-milky-way-foreground focus-visible:ring-0"
                />
              </FieldRow>
              <FieldRow label="DDI">
                <Input
                  type="text"
                  inputMode="tel"
                  value={phoneCountry}
                  placeholder="+55"
                  onChange={(event) => setPhoneCountry(event.target.value)}
                  className="h-9 flex-1 rounded-xl border border-foreground/10 bg-milky-way px-3 text-right text-milky-way-foreground focus-visible:ring-0"
                />
              </FieldRow>
              <FieldRow label="Celular">
                <Input
                  type="tel"
                  value={phone}
                  placeholder="11999999999"
                  onChange={(event) => setPhone(event.target.value)}
                  className="h-9 flex-1 rounded-xl border border-foreground/10 bg-milky-way px-3 text-right text-milky-way-foreground focus-visible:ring-0"
                />
              </FieldRow>
              <FieldRow label="WhatsApp">
                <Input
                  type="tel"
                  value={whatsapp}
                  placeholder="+5511999999999"
                  onChange={(event) => setWhatsapp(event.target.value)}
                  className="h-9 flex-1 rounded-xl border border-foreground/10 bg-milky-way px-3 text-right text-milky-way-foreground focus-visible:ring-0"
                />
              </FieldRow>
              <FieldRow label="Data nascimento">
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  className="h-9 flex-1 rounded-xl border border-foreground/10 bg-milky-way px-3 text-right text-milky-way-foreground focus-visible:ring-0"
                />
              </FieldRow>
              <FieldRow label="Hora nascimento">
                <Input
                  type="time"
                  value={birthTime}
                  onChange={(event) => setBirthTime(event.target.value)}
                  className="h-9 flex-1 rounded-xl border border-foreground/10 bg-milky-way px-3 text-right text-milky-way-foreground focus-visible:ring-0"
                />
              </FieldRow>
            </div>

            <div className="relative space-y-2">
              <Label htmlFor="birth-place" className="text-sm font-normal text-muted-foreground">
                Local de nascimento
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="birth-place"
                  type="text"
                  value={placeQuery}
                  onChange={(event) => {
                    setPlaceQuery(event.target.value);
                    setLocationError(null);
                  }}
                  onFocus={() => setLocationOpen(locationResults.length > 0)}
                  placeholder="Digite cidade, estado e país"
                  className="h-9 rounded-xl border border-foreground/10 bg-milky-way pl-9 text-milky-way-foreground focus-visible:ring-0"
                />
                {locationLoading ? (
                  <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : null}
              </div>
              <AnimatePresence>
                {locationOpen ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="z-30 mt-1 max-h-80 overflow-y-auto rounded-xl border border-foreground/10 bg-background"
                  >
                    {locationResults.map((locationOption) => (
                      <button
                        key={`${locationOption.displayName}-${locationOption.lat}-${locationOption.lng}`}
                        type="button"
                        onClick={() => {
                          void handleSelectLocation(locationOption);
                          setLocationError(null);
                        }}
                        className="flex w-full items-start gap-2 border-b border-foreground/10 px-3 py-2 text-left last:border-b-0 hover:bg-muted/40"
                      >
                        <MapPin className="mt-0.5 size-3.5 text-muted-foreground" />
                        <span className="text-xs leading-relaxed text-foreground">{locationOption.displayName}</span>
                      </button>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
              {locationError ? <p className="text-[11px] text-destructive">{locationError}</p> : null}
            </div>

            <motion.button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              whileTap={{ scale: 0.98 }}
              className="h-10 w-full rounded-full bg-iris text-sm font-semibold text-iris-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </motion.button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                asChild
                className="h-10 w-full rounded-full border-foreground/20 bg-milky-way text-milky-way-foreground hover:opacity-90"
              >
                <a
                  href={`https://wa.me/5511999999999?text=${encodeURIComponent("Olá, preciso de ajuda com Data Iris")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-1.5 size-4" /> Suporte
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSignOut()}
                className="h-10 w-full rounded-full border-foreground/20 bg-milky-way text-milky-way-foreground hover:opacity-90"
              >
                Sair
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </ChatBubble>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-sm font-normal">
      <Label className="w-32 shrink-0 text-muted-foreground">{label}</Label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function ProfileGreetingBubble() {
  const { user } = useDashboardUser();

  return (
    <ChatBubble from="iris" className={BUBBLE_CLASS}>
      <p className="font-jakarta text-[18px] font-black leading-[1.25] tracking-[0.01em] sm:text-[22px] md:text-[24px]">
        Olá {user.nome || "—"}, este é o seu perfil.
      </p>
    </ChatBubble>
  );
}

export function ProfileWelcomeCard() {
  return (
    <div className="rounded-3xl border border-foreground/10 bg-background px-6 py-5 shadow-[6px_8px_24px_-8px_hsl(0_0%_0%/0.18),2px_3px_8px_-3px_hsl(0_0%_0%/0.12)] sm:px-8 sm:py-6">
      <p className="text-sm leading-relaxed text-foreground/90">
        Boas vindas! O Sistema Data Iris não necessita de nomes completos, você pode colocar apelido. A consulta é
        confidencial.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">
        Para toda pergunta é necessário pelo menos a data completa de nascimento, e estado de nascimento.
      </p>
    </div>
  );
}

export function ProfileBackLink() {
  return (
    <Link
      href="/previsao-com-data"
      className="block border-t border-foreground/10 pt-3 text-xs font-normal text-muted-foreground transition-colors hover:text-iris"
    >
      ← Voltar para previsão com datas
    </Link>
  );
}
