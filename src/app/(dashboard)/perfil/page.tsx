"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MapPin, Search } from "lucide-react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";

import { DASHBOARD_ME_KEY, useDashboardUser } from "@/components/dashboard/DashboardUserContext";
import { DeleteAccountDialog } from "@/components/perfil/DeleteAccountDialog";
import { NatalChartSection } from "@/components/perfil/NatalChartSection";
import { PredictionHistoryList } from "@/components/perfil/PredictionHistoryList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import type { LocationData } from "@/types/calculator";

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

export default function PerfilPage() {
  return (
    <main className="min-h-full bg-background px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-3xl">
        <Suspense fallback={null}>
          <PerfilConfirmationToast />
        </Suspense>
        <PerfilContent />
      </div>
    </main>
  );
}

function PerfilConfirmationToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("confirmar-exclusao") === "1") {
      toast.success("Pedido de exclusão confirmado. Sua conta será apagada em até 7 dias.");
    }
  }, [searchParams]);

  return null;
}

function PerfilContent() {
  const { user } = useDashboardUser();
  const { mutate } = useSWRConfig();
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

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

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
        toast.error(payload.error ?? "Não foi possível salvar seu perfil agora.");
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

  return (
    <>
      <section className="space-y-2 pb-6">
        <p className="font-ubuntu text-[10px] tracking-[0.22em] text-muted-foreground uppercase">Conta</p>
        <h1 className="font-jakarta text-3xl font-black tracking-tight text-foreground">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Olá {user.nome || "—"}, este é o seu perfil. O Sistema Data Astral não necessita de nomes completos — você pode
          usar um apelido. A consulta é confidencial.
        </p>
      </section>

      <form onSubmit={handleSave}>
        <section>
          <header className="pb-4">
            <p className="text-[12px] font-black tracking-[0.22em] text-foreground uppercase">01 · Dados pessoais</p>
            <h2 className="mt-1 font-jakarta text-xl font-black tracking-tight">Editar</h2>
          </header>

          <div className="divide-y divide-border border-y border-border">
            <FieldRow label="Nome">
              <Input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Seu nome"
                className="border-0 bg-transparent px-0 text-right shadow-none focus-visible:ring-0"
              />
            </FieldRow>
            <FieldRow label="E-mail">
              <Input id="email" type="email" value={user.email} readOnly disabled className="border-0 bg-transparent px-0 text-right shadow-none" />
            </FieldRow>
            <FieldRow label="DDI">
              <Input
                id="phone-country"
                type="text"
                inputMode="tel"
                value={phoneCountry}
                onChange={(event) => setPhoneCountry(event.target.value)}
                placeholder="+55"
                className="border-0 bg-transparent px-0 text-right shadow-none focus-visible:ring-0"
              />
            </FieldRow>
            <FieldRow label="Celular">
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="11999999999"
                className="border-0 bg-transparent px-0 text-right shadow-none focus-visible:ring-0"
              />
            </FieldRow>
            <FieldRow label="WhatsApp">
              <Input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="+5511999999999"
                className="border-0 bg-transparent px-0 text-right shadow-none focus-visible:ring-0"
              />
            </FieldRow>
            <FieldRow label="Data nascimento">
              <Input
                id="birth-date"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className="border-0 bg-transparent px-0 text-right shadow-none focus-visible:ring-0"
              />
            </FieldRow>
            <FieldRow label="Hora nascimento">
              <Input
                id="birth-time"
                type="time"
                value={birthTime}
                onChange={(event) => setBirthTime(event.target.value)}
                className="border-0 bg-transparent px-0 text-right shadow-none focus-visible:ring-0"
              />
            </FieldRow>
          </div>

          <div className="relative space-y-2 py-4">
            <Label htmlFor="birth-place" className="text-sm text-muted-foreground">
              Local de nascimento
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 text-muted-foreground" />
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
                className="rounded-none border-0 border-b border-border bg-transparent pl-6 shadow-none focus-visible:ring-0"
              />
              {locationLoading ? <Loader2 className="absolute top-1/2 right-0 size-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
            </div>
            <AnimatePresence>
              {locationOpen ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="z-30 mt-1 max-h-80 overflow-y-auto border border-border bg-background"
                >
                  {locationResults.map((locationOption) => (
                    <button
                      key={`${locationOption.displayName}-${locationOption.lat}-${locationOption.lng}`}
                      type="button"
                      onClick={() => {
                        void handleSelectLocation(locationOption);
                        setLocationError(null);
                      }}
                      className="flex w-full items-start gap-2 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted/40"
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

          <div className="flex justify-end py-4">
            <Button type="submit" disabled={saving} className="min-w-44">
              {saving ? "Salvando..." : "Salvar Perfil"}
            </Button>
          </div>
        </section>
      </form>

      <NatalChartSection user={user} />
      <PredictionHistoryList />
      <DeleteAccountDialog user={user} />

      <p className="border-t border-border py-5 text-xs text-muted-foreground">
        Créditos, compras e atalhos financeiros ficam no{" "}
        <Link href="/financeiro" className="text-foreground underline-offset-4 hover:underline">
          Financeiro
        </Link>
        . Esta divisão é intencional: o perfil guarda identidade e mapa natal.
      </p>
    </>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <Label className="w-32 shrink-0 text-sm font-normal text-muted-foreground">{label}</Label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
